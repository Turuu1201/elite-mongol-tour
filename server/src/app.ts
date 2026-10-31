import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { checkPassword, issueToken, requireAdmin } from "./auth.js";
import { db } from "./db.js";
import { notifyNewBooking } from "./mailer.js";
import { registerAnalytics } from "./analytics.js";

export const app = express();
app.disable("x-powered-by");
// Vercel зэрэг proxy-ийн ард req.ip нь жинхэнэ хэрэглэгчийн IP байна (зөвхөн хурд хязгаарлахад)
app.set("trust proxy", 1);
app.use(express.json({ limit: "100kb" }));

// ---------- Хэл ----------

type Lang = "mn" | "en";

const MESSAGES = {
  mn: {
    tourNotFound: "Аялал олдсонгүй",
    bookingNotFound: "Захиалга олдсонгүй",
    notFound: "Олдсонгүй",
    invalid: "Мэдээлэл буруу байна",
    server: "Серверийн алдаа гарлаа",
    wrongPassword: "Нууц үг буруу байна",
    fullName: "Нэрээ бүтэн оруулна уу",
    email: "И-мэйл хаяг буруу байна",
    phone: "Утасны дугаар буруу байна",
    date: "Огноо буруу байна",
    futureDate: "Ирээдүйн огноо сонгоно уу",
    minGuests: "Хамгийн багадаа 1 хүн",
    maxGroup: (n: number) => `Энэ аялалд хамгийн ихдээ ${n} хүн явна`,
    tourTitle: "Аяллын нэрийг (монголоор) оруулна уу",
    tourSummary: "Товч тайлбарыг (монголоор) оруулна уу",
    tourDescription: "Дэлгэрэнгүй тайлбарыг (монголоор) оруулна уу",
    slug: "URL нь зөвхөн латин жижиг үсэг, тоо, зураас (-) агуулна",
    slugTaken: "Ийм URL-тэй аялал аль хэдийн байна",
    images: "Дор хаяж нэг зургийн холбоос оруулна уу",
    imageUrl: "Зургийн холбоос буруу байна (https://... байх ёстой)",
    dayTitle: "Хөтөлбөрийн өдөр бүрт гарчиг оруулна уу",
    field: (path: string) => `Мэдээлэл буруу байна: ${path}`,
  },
  en: {
    tourNotFound: "Tour not found",
    bookingNotFound: "Booking not found",
    notFound: "Not found",
    invalid: "Invalid data",
    server: "Something went wrong on our side",
    wrongPassword: "Wrong password",
    fullName: "Please enter your full name",
    email: "Invalid email address",
    phone: "Invalid phone number",
    date: "Invalid date",
    futureDate: "Please choose a future date",
    minGuests: "At least 1 traveller",
    maxGroup: (n: number) => `This tour takes at most ${n} travellers`,
    tourTitle: "Please enter the tour name (in Mongolian)",
    tourSummary: "Please enter a short summary (in Mongolian)",
    tourDescription: "Please enter a description (in Mongolian)",
    slug: "The URL may only contain lowercase Latin letters, digits and hyphens",
    slugTaken: "A tour with this URL already exists",
    images: "Please add at least one image URL",
    imageUrl: "Invalid image URL (must start with https://)",
    dayTitle: "Every itinerary day needs a title",
    field: (path: string) => `Invalid value: ${path}`,
  },
} satisfies Record<Lang, unknown>;

const langOf = (req: Request): Lang => (req.query.lang === "en" ? "en" : "mn");
const msg = (req: Request) => MESSAGES[langOf(req)];

// Монгол хэл үндсэн; бусад хэлд орчуулга байвал түүнийг, үгүй бол монголоор буцаана
function tourColumns(lang: Lang, prefix = "") {
  const p = prefix;
  const text = (f: string) => (lang === "mn" ? `${p}${f}` : `coalesce(${p}translations->'${lang}'->>'${f}', ${p}${f})`);
  const json = (f: string) => (lang === "mn" ? `${p}${f}` : `coalesce(${p}translations->'${lang}'->'${f}', ${p}${f})`);
  return `
    ${p}id, ${p}slug, ${text("title")} as title, ${p}region, ${p}category,
    ${text("summary")} as summary, ${text("description")} as description,
    ${p}duration_days as "durationDays", ${p}price, ${p}max_group as "maxGroup",
    ${p}rating, ${p}review_count as "reviewCount", ${p}images,
    ${json("highlights")} as highlights, ${json("itinerary")} as itinerary, ${json("includes")} as includes,
    ${p}featured, ${p}active`;
}

const localTitle = (lang: Lang, p = "") =>
  lang === "mn" ? `${p}title` : `coalesce(${p}translations->'${lang}'->>'title', ${p}title)`;

const bookingRef = (id: number) => `EMT-${String(id).padStart(5, "0")}`;

// ---------- Нийтийн API ----------

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const tourQuery = z.object({
  q: z.string().trim().max(100).optional(),
  region: z.string().max(40).optional(),
  category: z.string().max(40).optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  duration: z.enum(["short", "medium", "long"]).optional(),
  featured: z.enum(["1"]).optional(),
  sort: z.enum(["popular", "price-asc", "price-desc", "duration"]).default("popular"),
});

const SORTS = {
  popular: "featured desc, rating desc, review_count desc",
  "price-asc": "price asc",
  "price-desc": "price desc",
  duration: "duration_days asc",
} as const;

const DURATIONS = {
  short: "duration_days <= 3",
  medium: "duration_days between 4 and 7",
  long: "duration_days >= 8",
} as const;

app.get("/api/tours", async (req, res) => {
  const f = tourQuery.parse(req.query);
  const where = ["active"];
  const params: unknown[] = [];
  const add = (sql: (n: number) => string, value: unknown) => {
    params.push(value);
    where.push(sql(params.length));
  };

  // Хайлт аль ч хэл дээр ажиллана
  if (f.q)
    add(
      (n) => `(title ilike $${n} or summary ilike $${n}
        or translations->'en'->>'title' ilike $${n} or translations->'en'->>'summary' ilike $${n})`,
      `%${f.q}%`,
    );
  if (f.region) add((n) => `region = $${n}`, f.region);
  if (f.category) add((n) => `category = $${n}`, f.category);
  if (f.maxPrice) add((n) => `price <= $${n}`, f.maxPrice);
  if (f.duration) where.push(DURATIONS[f.duration]);
  if (f.featured) where.push("featured");

  const conn = await db();
  const tours = await conn.query(
    `select ${tourColumns(langOf(req))} from tours where ${where.join(" and ")} order by ${SORTS[f.sort]}`,
    params,
  );
  res.json(tours);
});

app.get("/api/tours/:slug", async (req, res) => {
  const conn = await db();
  const [tour] = await conn.query(`select ${tourColumns(langOf(req))} from tours where slug = $1 and active`, [
    req.params.slug,
  ]);
  if (!tour) {
    res.status(404).json({ error: msg(req).tourNotFound });
    return;
  }
  res.json(tour);
});

const todayIso = () => new Date().toISOString().slice(0, 10);

const bookingInput = (m: (typeof MESSAGES)[Lang]) =>
  z.object({
    tourId: z.number().int().positive(),
    fullName: z.string().trim().min(2, m.fullName).max(120),
    email: z.email(m.email).max(200),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s-]{8,20}$/, m.phone),
    startDate: z.iso.date(m.date).refine((d) => d > todayIso(), m.futureDate),
    guests: z.number().int().min(1, m.minGuests).max(50),
    note: z.string().trim().max(1000).default(""),
  });

const BOOKING_INPUT = { mn: bookingInput(MESSAGES.mn), en: bookingInput(MESSAGES.en) };

app.post("/api/bookings", async (req, res) => {
  const m = msg(req);
  const parsed = BOOKING_INPUT[langOf(req)].safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? m.invalid });
    return;
  }
  const b = parsed.data;
  const conn = await db();
  const [tour] = await conn.query<{ price: number; maxGroup: number; title: string; slug: string }>(
    `select price, max_group as "maxGroup", title, slug from tours where id = $1 and active`,
    [b.tourId],
  );
  if (!tour) {
    res.status(404).json({ error: m.tourNotFound });
    return;
  }
  if (b.guests > tour.maxGroup) {
    res.status(400).json({ error: m.maxGroup(tour.maxGroup) });
    return;
  }

  const total = tour.price * b.guests;
  const [row] = await conn.query<{ id: number }>(
    `insert into bookings (tour_id, full_name, email, phone, start_date, guests, note, total_price)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
    [b.tourId, b.fullName, b.email, b.phone, b.startDate, b.guests, b.note, total],
  );
  const reference = bookingRef(row.id);

  // Vercel дээр хариу буцаасны дараа функц зогсож болох тул имэйлийг хүлээж байгаад хариулна
  await notifyNewBooking({
    reference,
    tourTitle: tour.title,
    tourSlug: tour.slug,
    fullName: b.fullName,
    email: b.email,
    phone: b.phone,
    startDate: b.startDate,
    guests: b.guests,
    totalPrice: total,
    note: b.note,
  });
  res.status(201).json({ reference, totalPrice: total });
});

// ---------- Админ API ----------

app.post("/api/admin/login", (req, res) => {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!checkPassword(password)) {
    res.status(401).json({ error: msg(req).wrongPassword });
    return;
  }
  res.json({ token: issueToken() });
});

app.use("/api/admin", requireAdmin);

app.get("/api/admin/bookings", async (req, res) => {
  const conn = await db();
  const bookings = await conn.query<{ id: number }>(
    `select b.id, b.full_name as "fullName", b.email, b.phone,
            to_char(b.start_date, 'YYYY-MM-DD') as "startDate",
            b.guests, b.note, b.total_price as "totalPrice", b.status, b.created_at as "createdAt",
            ${localTitle(langOf(req), "t.")} as "tourTitle", t.slug as "tourSlug"
     from bookings b join tours t on t.id = b.tour_id
     order by b.created_at desc
     limit 500`,
  );
  const [stats] = await conn.query(
    `select count(*)::int as total,
            count(*) filter (where status = 'pending')::int as pending,
            count(*) filter (where status = 'confirmed')::int as confirmed,
            coalesce(sum(total_price) filter (where status = 'confirmed'), 0)::bigint::text as revenue,
            count(*) filter (where status <> 'cancelled' and start_date >= current_date)::int as upcoming
     from bookings`,
  );
  res.json({ stats, bookings: bookings.map((b) => ({ ...b, reference: bookingRef(b.id) })) });
});

const statusInput = z.object({ status: z.enum(["pending", "confirmed", "cancelled"]) });

app.patch("/api/admin/bookings/:id", async (req, res) => {
  const { status } = statusInput.parse(req.body);
  const conn = await db();
  const rows = await conn.query("update bookings set status = $1 where id = $2 returning id", [
    status,
    Number(req.params.id),
  ]);
  if (!rows.length) {
    res.status(404).json({ error: msg(req).bookingNotFound });
    return;
  }
  res.json({ ok: true });
});

app.get("/api/admin/tours", async (req, res) => {
  const conn = await db();
  const tours = await conn.query(
    `select t.id, t.slug, ${localTitle(langOf(req), "t.")} as title, t.region, t.price,
            t.duration_days as "durationDays", t.featured, t.active, count(b.id)::int as "bookingCount"
     from tours t left join bookings b on b.tour_id = t.id and b.status <> 'cancelled'
     group by t.id order by t.id`,
  );
  res.json(tours);
});

const tourPatch = z
  .object({
    active: z.boolean(),
    featured: z.boolean(),
    price: z.number().int().min(0),
  })
  .partial();

app.patch("/api/admin/tours/:id", async (req, res) => {
  const patch = tourPatch.parse(req.body);
  const conn = await db();
  const rows = await conn.query(
    `update tours set active = coalesce($1, active), featured = coalesce($2, featured), price = coalesce($3, price)
     where id = $4 returning id`,
    [patch.active ?? null, patch.featured ?? null, patch.price ?? null, Number(req.params.id)],
  );
  if (!rows.length) {
    res.status(404).json({ error: msg(req).tourNotFound });
    return;
  }
  res.json({ ok: true });
});

// ---------- Аялал нэмэх / засах ----------

const REGIONS = ["Төв", "Говь", "Хойд", "Баруун", "Зүүн"] as const;
const CATEGORIES = ["Байгаль", "Адал явдал", "Явган аялал", "Соёл", "Майхан", "Амралт", "Өвөл"] as const;

const lines = (max: number, len: number) => z.array(z.string().trim().max(len)).max(max)
  .transform((a) => a.filter(Boolean));

function tourInput(m: (typeof MESSAGES)[Lang]) {
  const content = {
    highlights: lines(12, 120),
    includes: lines(20, 120),
    itinerary: z
      .array(z.object({ title: z.string().trim().min(1, m.dayTitle).max(120), text: z.string().trim().max(1000) }))
      .max(30),
  };
  return z.object({
    slug: z.string().trim().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, m.slug),
    region: z.enum(REGIONS),
    category: z.enum(CATEGORIES),
    durationDays: z.number().int().min(1).max(60),
    price: z.number().int().min(0).max(1_000_000_000),
    maxGroup: z.number().int().min(1).max(100),
    images: z.array(z.url({ protocol: /^https?$/, error: m.imageUrl }).max(1000)).min(1, m.images).max(10),
    featured: z.boolean(),
    active: z.boolean(),
    mn: z.object({
      title: z.string().trim().min(2, m.tourTitle).max(120),
      summary: z.string().trim().min(10, m.tourSummary).max(300),
      description: z.string().trim().min(20, m.tourDescription).max(5000),
      ...content,
    }),
    // Англи хэсэг заавал биш; хоосон талбарууд монгол хувилбараараа харагдана
    en: z.object({
      title: z.string().trim().max(120),
      summary: z.string().trim().max(300),
      description: z.string().trim().max(5000),
      ...content,
    }),
  });
}

const TOUR_INPUT = { mn: tourInput(MESSAGES.mn), en: tourInput(MESSAGES.en) };
type TourInput = z.infer<(typeof TOUR_INPUT)["mn"]>;

const numberDays = (days: { title: string; text: string }[]) => days.map((d, i) => ({ day: i + 1, ...d }));

function translationsOf(en: TourInput["en"]) {
  const out: Record<string, unknown> = {};
  for (const key of ["title", "summary", "description"] as const) if (en[key]) out[key] = en[key];
  for (const key of ["highlights", "includes"] as const) if (en[key].length) out[key] = en[key];
  if (en.itinerary.length) out.itinerary = numberDays(en.itinerary);
  return Object.keys(out).length ? { en: out } : {};
}

function tourParams(t: TourInput) {
  return [
    t.slug, t.mn.title, t.region, t.category, t.mn.summary, t.mn.description, t.durationDays, t.price, t.maxGroup,
    JSON.stringify(t.images), JSON.stringify(t.mn.highlights), JSON.stringify(numberDays(t.mn.itinerary)),
    JSON.stringify(t.mn.includes), t.featured, t.active, JSON.stringify(translationsOf(t.en)),
  ];
}

function parseTour(req: Request, res: Response) {
  const m = msg(req);
  const parsed = TOUR_INPUT[langOf(req)].safeParse(req.body);
  if (parsed.success) return parsed.data;
  const issue = parsed.error.issues[0];
  const custom = issue && Object.values(m).includes(issue.message as never);
  res.status(400).json({ error: custom ? issue.message : m.field(issue?.path.join(".") ?? "") });
  return null;
}

const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === "23505";

app.get("/api/admin/tours/:id", async (req, res) => {
  const conn = await db();
  const [tour] = await conn.query(
    `select id, slug, title, region, category, summary, description, duration_days as "durationDays", price,
            max_group as "maxGroup", images, highlights, itinerary, includes, featured, active, translations
     from tours where id = $1`,
    [Number(req.params.id)],
  );
  if (!tour) {
    res.status(404).json({ error: msg(req).tourNotFound });
    return;
  }
  res.json(tour);
});

app.post("/api/admin/tours", async (req, res) => {
  const t = parseTour(req, res);
  if (!t) return;
  const conn = await db();
  try {
    const [row] = await conn.query<{ id: number }>(
      `insert into tours (slug, title, region, category, summary, description, duration_days, price, max_group,
         images, highlights, itinerary, includes, featured, active, translations, rating, review_count)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14,$15,$16::jsonb, 0, 0)
       returning id`,
      tourParams(t),
    );
    res.status(201).json({ id: row.id, slug: t.slug });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    res.status(409).json({ error: msg(req).slugTaken });
  }
});

app.put("/api/admin/tours/:id", async (req, res) => {
  const t = parseTour(req, res);
  if (!t) return;
  const conn = await db();
  try {
    const rows = await conn.query(
      `update tours set slug = $1, title = $2, region = $3, category = $4, summary = $5, description = $6,
         duration_days = $7, price = $8, max_group = $9, images = $10::jsonb, highlights = $11::jsonb,
         itinerary = $12::jsonb, includes = $13::jsonb, featured = $14, active = $15, translations = $16::jsonb
       where id = $17 returning id`,
      [...tourParams(t), Number(req.params.id)],
    );
    if (!rows.length) {
      res.status(404).json({ error: msg(req).tourNotFound });
      return;
    }
    res.json({ id: Number(req.params.id), slug: t.slug });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    res.status(409).json({ error: msg(req).slugTaken });
  }
});

registerAnalytics(app);

app.use("/api", (req, res) => {
  res.status(404).json({ error: msg(req).notFound });
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const m = msg(req);
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: m.invalid });
    return;
  }
  console.error(err);
  res.status(500).json({ error: m.server });
});

// Зарим serverless орчин (жишээ нь Vercel) default export хайдаг
export default app;
