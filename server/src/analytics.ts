import type { Express, Request } from "express";
import { z } from "zod";
import { db } from "./db.js";

// Өдрийн бүлэглэлтийг Монголын цагаар хийнэ
const TZ = "Asia/Ulaanbaatar";

export const EVENT_TYPES = [
  "page_view",
  "tour_view",
  "search",
  "filter",
  "booking_start",
  "booking_submit",
  "lang_switch",
] as const;

const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python|monitor/i;

function deviceOf(ua: string) {
  if (/ipad|tablet|kindle|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}

function referrerHost(raw: string | undefined, req: Request) {
  if (!raw) return "";
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    const own = (req.get("host") ?? "").split(":")[0];
    return host === own || host === "localhost" || host === "127.0.0.1" ? "" : host;
  } catch {
    return "";
  }
}

// Нэг IP-ээс минутад хэт олон хүсэлт ирвэл хаяна (serverless дээр instance тус бүрт)
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { count: 1, reset: now + 60_000 });
    if (hits.size > 10_000) hits.clear();
    return false;
  }
  return ++h.count > 120;
}

const idString = z.string().regex(/^[A-Za-z0-9-]{8,64}$/);

const eventInput = z.object({
  type: z.enum(EVENT_TYPES),
  visitorId: idString,
  sessionId: idString,
  path: z.string().max(200).default(""),
  tourId: z.number().int().positive().optional(),
  lang: z.enum(["mn", "en"]).default("mn"),
  referrer: z.string().max(500).optional(),
  props: z
    .record(z.string().max(40), z.union([z.string().max(100), z.number(), z.boolean()]))
    .refine((p) => Object.keys(p).length <= 8)
    .default({}),
});

const rangeInput = z.object({ days: z.coerce.number().int().refine((d) => [7, 30, 90].includes(d)).default(30) });

export function registerAnalytics(app: Express) {
  // Нийтийн: браузераас ирэх үйлдлийн бүртгэл. Үргэлж 204 буцаана (алдаа нь сайтад нөлөөлөхгүй).
  // Serverless дээр хариу илгээсний дараа функц зогсож болох тул эхлээд хадгалаад дараа нь хариулна.
  app.post("/api/events", async (req, res) => {
    const ua = req.get("user-agent") ?? "";
    const parsed = eventInput.safeParse(req.body);
    if (!ua || BOT_UA.test(ua) || req.get("dnt") === "1" || rateLimited(req.ip ?? "") || !parsed.success) {
      res.status(204).end();
      return;
    }
    const e = parsed.data;
    try {
      const conn = await db();
      await conn.query(
        `insert into events (visitor_id, session_id, type, path, tour_id, lang, device, referrer, props)
         values ($1, $2, $3, $4, (select id from tours where id = $5), $6, $7, $8, $9::jsonb)`,
        [
          e.visitorId, e.sessionId, e.type, e.path, e.tourId ?? null, e.lang, deviceOf(ua),
          referrerHost(e.referrer, req), JSON.stringify(e.props),
        ],
      );
    } catch (err) {
      console.error("event insert failed:", err instanceof Error ? err.message : err);
    }
    res.status(204).end();
  });

  // Админ: хяналтын самбарын өгөгдөл (requireAdmin нь /api/admin дээр өмнө нь тавигдсан)
  app.get("/api/admin/analytics", async (req, res) => {
    const { days } = rangeInput.parse(req.query);
    const lang = req.query.lang === "en" ? "en" : "mn";
    const title = lang === "mn" ? "t.title" : "coalesce(t.translations->'en'->>'title', t.title)";
    const conn = await db();
    // $1 = хоногийн тоо; одоогийн үе: [now - days, now), өмнөх үе: [now - 2*days, now - days)
    const cur = `e.created_at >= now() - make_interval(days => $1)`;

    const totals = (from: string, to: string) =>
      conn.query<Record<string, number>>(
        `select
           count(distinct visitor_id) filter (where type = 'page_view')::int as visitors,
           count(distinct session_id) filter (where type = 'page_view')::int as sessions,
           count(*) filter (where type = 'page_view')::int as "pageViews",
           count(*) filter (where type = 'tour_view')::int as "tourViews",
           (select count(*)::int from bookings b
             where b.created_at >= now() - make_interval(days => ${from}) and b.created_at < now() - make_interval(days => ${to})) as bookings
         from events
         where created_at >= now() - make_interval(days => ${from}) and created_at < now() - make_interval(days => ${to})`,
        [days],
      );

    const [[current], [previous], daily, tours, funnel, devices, langs, searches, referrers, pages, recent] =
      await Promise.all([
        totals("$1", "0"),
        totals("$1 * 2", "$1"),
        conn.query(
          `with d as (
             select generate_series((now() at time zone '${TZ}')::date - ($1 - 1), (now() at time zone '${TZ}')::date, interval '1 day')::date as day
           ),
           ev as (
             select (created_at at time zone '${TZ}')::date as day,
                    count(distinct visitor_id) filter (where type = 'page_view')::int as visitors,
                    count(*) filter (where type = 'page_view')::int as "pageViews"
             from events e where ${cur} group by 1
           ),
           bk as (
             select (created_at at time zone '${TZ}')::date as day, count(*)::int as bookings
             from bookings e where ${cur} group by 1
           )
           select to_char(d.day, 'YYYY-MM-DD') as day, coalesce(ev.visitors, 0) as visitors,
                  coalesce(ev."pageViews", 0) as "pageViews", coalesce(bk.bookings, 0) as bookings
           from d left join ev using (day) left join bk using (day) order by d.day`,
          [days],
        ),
        conn.query(
          `with v as (
             select tour_id, count(*)::int as views, count(distinct visitor_id)::int as visitors
             from events e where ${cur} and type = 'tour_view' and tour_id is not null group by tour_id
           ),
           s as (
             select tour_id, count(distinct visitor_id)::int as starts
             from events e where ${cur} and type = 'booking_start' and tour_id is not null group by tour_id
           ),
           b as (
             select tour_id, count(*)::int as bookings from bookings e where ${cur} group by tour_id
           )
           select t.id, t.slug, ${title} as title, coalesce(v.views, 0) as views, coalesce(v.visitors, 0) as visitors,
                  coalesce(s.starts, 0) as starts, coalesce(b.bookings, 0) as bookings
           from tours t left join v on v.tour_id = t.id left join s on s.tour_id = t.id left join b on b.tour_id = t.id
           where coalesce(v.views, 0) > 0 or coalesce(b.bookings, 0) > 0
           order by views desc, bookings desc limit 10`,
          [days],
        ),
        conn.query(
          `select
             count(distinct visitor_id) filter (where type = 'page_view')::int as visitors,
             count(distinct visitor_id) filter (where type = 'tour_view')::int as "tourViewers",
             count(distinct visitor_id) filter (where type = 'booking_start')::int as starters,
             count(distinct visitor_id) filter (where type = 'booking_submit')::int as bookers
           from events e where ${cur}`,
          [days],
        ),
        conn.query(
          `select device as key, count(distinct visitor_id)::int as value
           from events e where ${cur} and type = 'page_view' group by 1 order by 2 desc`,
          [days],
        ),
        conn.query(
          `select lang as key, count(distinct visitor_id)::int as value
           from events e where ${cur} and type = 'page_view' group by 1 order by 2 desc`,
          [days],
        ),
        conn.query(
          `select lower(trim(props->>'q')) as key, count(*)::int as value
           from events e where ${cur} and type = 'search' and coalesce(props->>'q', '') <> ''
           group by 1 order by 2 desc limit 8`,
          [days],
        ),
        conn.query(
          `select referrer as key, count(distinct session_id)::int as value
           from events e where ${cur} and type = 'page_view' and referrer <> ''
           group by 1 order by 2 desc limit 8`,
          [days],
        ),
        conn.query(
          `select path as key, count(*)::int as value
           from events e where ${cur} and type = 'page_view' group by 1 order by 2 desc limit 8`,
          [days],
        ),
        conn.query(
          `select e.id::text, e.created_at as "createdAt", e.type, e.path, e.device, e.lang, e.props,
                  ${title} as "tourTitle"
           from events e left join tours t on t.id = e.tour_id
           order by e.created_at desc limit 25`,
        ),
      ]);

    res.json({
      days,
      current,
      previous,
      daily,
      tours,
      funnel: funnel[0],
      devices,
      langs,
      searches,
      referrers,
      pages,
      recent,
    });
  });
}
