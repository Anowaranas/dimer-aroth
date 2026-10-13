import express from "express";
import compression from "compression";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  const isDevMode = process.env.APP_MODE === "dev" || process.env.npm_lifecycle_event === "dev";
  app.use(compression());
  app.use(express.json({ limit: "50mb" }));
  app.all(["/healthz", "/_ah/health", "/_ah/start", "/startup", "/ping", "/api/health", "/api/healthz", "/api/db/health", "/livez", "/readyz", "/health", "/ready"], (_req, res) => {
    res.status(200).json({
      status: "ok",
      engine: "\u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8 \u09A1\u09BF\u09AE\u09C7\u09B0 \u0986\u09A1\u09BC\u09CE App Server",
      uptime: process.uptime(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/cloud-backups", (_req, res) => {
    res.status(200).json({ backups: [] });
  });
  const distPath = fs.existsSync(path.resolve(__dirname, "dist")) ? path.resolve(__dirname, "dist") : path.resolve(process.cwd(), "dist");
  const distIndexHtml = path.resolve(distPath, "index.html");
  if (!isDevMode) {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html") || filePath.endsWith("sw.js") || filePath.endsWith("registerSW.js") || filePath.endsWith("manifest.json")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
          } else if (filePath.includes("/assets/")) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        }
      }));
    }
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      if (fs.existsSync(distIndexHtml)) {
        res.sendFile(distIndexHtml, (err) => {
          if (err && !res.headersSent) {
            res.status(200).send('<!doctype html><html><head><meta charset="utf-8"><title>\u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8 \u09A1\u09BF\u09AE\u09C7\u09B0 \u0986\u09A1\u09BC\u09CE</title></head><body><div id="root">\u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8 \u09A1\u09BF\u09AE\u09C7\u09B0 \u0986\u09A1\u09BC\u09CE</div></body></html>');
          }
        });
      } else {
        res.status(200).send('<!doctype html><html><head><meta charset="utf-8"><title>\u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8 \u09A1\u09BF\u09AE\u09C7\u09B0 \u0986\u09A1\u09BC\u09CE</title></head><body><div id="root">\u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8 \u09A1\u09BF\u09AE\u09C7\u09B0 \u0986\u09A1\u09BC\u09CE</div></body></html>');
      }
    });
  } else {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false
        },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("Vite middleware could not be loaded, using static fallback:", viteErr);
      if (fs.existsSync(distIndexHtml)) {
        app.use(express.static(distPath));
        app.get("*", (_req, res) => res.sendFile(distIndexHtml));
      }
    }
  }
  const port = isDevMode ? parseInt(process.env.DEFAULT_APP_PORT || "", 10) || parseInt(process.env.PORT || "", 10) || 3e3 : parseInt(process.env.PORT || "", 10) || 8080;
  const host = "0.0.0.0";
  const server = app.listen(port, host, () => {
    console.log(`Server listening on ${host}:${port} (Mode: ${isDevMode ? "Development" : "Production"})`);
  });
  server.on("error", (err) => {
    console.error(`Server error on port ${port}:`, err);
    process.exit(1);
  });
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Gracefully closing server...`);
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => {
      process.exit(0);
    }, 2e3);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
  });
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
  });
}
startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
