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
  const isProduction = process.env.NODE_ENV === "production" || process.env.npm_lifecycle_event === "start";
  const isDevMode = !isProduction && (process.env.APP_MODE === "dev" || process.env.npm_lifecycle_event === "dev");
  const PORT = isDevMode ? 3e3 : Number(process.env.PORT) || 8080;
  app.use(compression());
  app.use(express.json({ limit: "50mb" }));
  app.all(["/healthz", "/_ah/health", "/api/health", "/api/db/health"], (_req, res) => {
    res.status(200).json({
      status: "ok",
      engine: "\u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8 \u09A1\u09BF\u09AE\u09C7\u09B0 \u0986\u09A1\u09BC\u09CE App Server",
      uptime: process.uptime(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  const distPath = fs.existsSync(path.resolve(__dirname, "dist")) ? path.resolve(__dirname, "dist") : path.resolve(process.cwd(), "dist");
  const distIndexHtml = path.resolve(distPath, "index.html");
  if (!isDevMode) {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, { maxAge: "1h" }));
    }
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
      }
      if (fs.existsSync(distIndexHtml)) {
        res.sendFile(distIndexHtml);
      } else {
        res.status(200).send("<!doctype html><html><body><h1>\u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8 \u09A1\u09BF\u09AE\u09C7\u09B0 \u0986\u09A1\u09BC\u09CE</h1></body></html>");
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
  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (Mode: ${isDevMode ? "Development" : "Production"})`);
  });
  server.on("error", (err) => {
    console.error("Server listen error:", err);
  });
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Gracefully closing server...`);
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("Forced shutdown after timeout.");
      process.exit(0);
    }, 4e3);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
});
