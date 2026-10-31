import { app } from "./app.js";

// Vercel дээр app-ийг экспортлоход хангалттай; орон нутагт порт сонсоно.
if (!process.env.VERCEL) {
  try {
    process.loadEnvFile();
  } catch {
    // .env файл байхгүй бол орчны хувьсагчийг шууд ашиглана
  }
  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, () => console.log(`API: http://localhost:${port}`));
}

export default app;
