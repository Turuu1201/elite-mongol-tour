import nodemailer, { type Transporter } from "nodemailer";

// SMTP тохиргоо (.env):
//   SMTP_USER, SMTP_PASS  – Gmail хаяг ба App Password (заавал)
//   SMTP_HOST, SMTP_PORT, SMTP_SECURE – Gmail-ээс өөр сервер ашиглах бол
//   NOTIFY_EMAIL – захиалгын мэдэгдэл хүлээн авах хаяг (таслалаар хэд хэдэн хаяг)
//   SITE_URL     – имэйл дэх админ холбоосонд ашиглах сайтын хаяг

export interface BookingNotice {
  reference: string;
  tourTitle: string;
  tourSlug: string;
  fullName: string;
  email: string;
  phone: string;
  startDate: string;
  guests: number;
  totalPrice: number;
  note: string;
}

let transporter: Transporter | undefined;
let warned = false;

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass || !process.env.NOTIFY_EMAIL) return null;
  const port = Number(process.env.SMTP_PORT ?? 465);
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    // Gmail-ийн App Password-ийг зайтайгаар хуулсан ч ажиллана
    auth: { user, pass: pass.replace(/\s+/g, "") },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const money = (n: number) => `${new Intl.NumberFormat("en-US").format(n)}₮`;

function render(b: BookingNotice) {
  const site = (process.env.SITE_URL ?? "http://localhost:5173").replace(/\/+$/, "");
  const rows: [string, string][] = [
    ["Захиалгын дугаар", b.reference],
    ["Аялал", b.tourTitle],
    ["Эхлэх өдөр", b.startDate],
    ["Хүний тоо", `${b.guests} хүн`],
    ["Нийт дүн", money(b.totalPrice)],
    ["Захиалагч", b.fullName],
    ["И-мэйл", b.email],
    ["Утас", b.phone],
  ];
  if (b.note) rows.push(["Нэмэлт хүсэлт", b.note]);

  const text = [
    "Сайтаар шинэ захиалга ирлээ.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `Удирдлага: ${site}/admin`,
    `Аялал: ${site}/tours/${b.tourSlug}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="mn"><body style="margin:0;background:#f5efe6;font-family:Arial,Helvetica,sans-serif;color:#16181d">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#ffffff;border-radius:16px;padding:28px;border:1px solid #e7dfd2">
      <p style="margin:0;color:#e8572a;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">Шинэ захиалга</p>
      <h1 style="margin:8px 0 4px;font-size:22px">${escapeHtml(b.tourTitle)}</h1>
      <p style="margin:0 0 20px;color:#8a8378">${escapeHtml(b.reference)} · ${escapeHtml(b.startDate)} · ${b.guests} хүн</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows
          .map(
            ([k, v]) => `<tr>
          <td style="padding:8px 0;border-top:1px solid #f0ebe3;color:#8a8378;width:40%;vertical-align:top">${escapeHtml(k)}</td>
          <td style="padding:8px 0;border-top:1px solid #f0ebe3;font-weight:bold;white-space:pre-wrap">${escapeHtml(v)}</td>
        </tr>`,
          )
          .join("")}
      </table>
      <p style="margin:24px 0 0">
        <a href="${escapeHtml(site)}/admin" style="display:inline-block;background:#e8572a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">Удирдлага руу орох</a>
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#8a8378">Энэ имэйлд «Хариулах» дарвал захиалагч руу шууд илгээгдэнэ.</p>
    </div>
  </div>
</body></html>`;

  return { text, html };
}

// Захиалга аль хэдийн хадгалагдсан тул имэйл амжилтгүй болсон ч алдаа шидэхгүй, зөвхөн log-д бичнэ.
export async function notifyNewBooking(b: BookingNotice) {
  const t = getTransporter();
  if (!t) {
    if (!warned) console.warn("Имэйл тохируулаагүй (SMTP_USER, SMTP_PASS, NOTIFY_EMAIL): мэдэгдэл илгээгдсэнгүй");
    warned = true;
    return false;
  }
  const { text, html } = render(b);
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM ?? `"Elite Mongol Tour" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFY_EMAIL,
      replyTo: { name: b.fullName, address: b.email },
      subject: `Шинэ захиалга ${b.reference}: ${b.tourTitle} (${b.guests} хүн, ${b.startDate})`,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error(`Захиалгын имэйл илгээж чадсангүй (${b.reference}):`, err instanceof Error ? err.message : err);
    return false;
  }
}
