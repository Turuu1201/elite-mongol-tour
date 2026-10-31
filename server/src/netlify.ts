import serverless from "serverless-http";
import { app } from "./app.js";

// Netlify Function: /api/* хүсэлтийг netlify.toml-ийн redirect-ээр энд дамжуулна.
// Netlify замыг /.netlify/functions/api/... хэлбэрээр өгч болох тул Express-ийн /api/... болгоно.
export const handler = serverless(app, {
  request(req: { url?: string }) {
    if (req.url?.startsWith("/.netlify/functions/api")) {
      req.url = "/api" + req.url.slice("/.netlify/functions/api".length);
    }
  },
});
