import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, saveAppCloudData, getAppCloudData } from './src/db/users.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(compression());
  app.use(express.json({ limit: '50mb' }));

  // Universal Health check endpoints for Cloud Run and monitoring (Instant 200 OK)
  app.get(['/healthz', '/api/health', '/api/db/health'], (_req, res) => {
    res.status(200).json({
      status: 'ok',
      engine: 'প্রতিদিন ডিমের আড়ৎ App Server',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // User synchronization endpoint
  app.post('/api/auth/sync-user', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }
      const { email, name, picture } = req.body;
      const user = await getOrCreateUser(
        req.user.uid,
        email || req.user.email || 'user@example.com',
        name,
        picture
      );
      res.json({ success: true, user });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: error.message || 'User sync failed' });
    }
  });

  // Full dataset Cloud Sync / Backup endpoint
  app.post('/api/db/sync-all', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const data = req.body;
      const email = req.user.email || 'user@example.com';
      const result = await saveAppCloudData(req.user.uid, email, data);
      res.json(result);
    } catch (error: any) {
      console.error('Error syncing app data to PostgreSQL:', error);
      res.status(500).json({ error: error.message || 'Data sync failed' });
    }
  });

  // Full dataset Cloud Restore / Load endpoint
  app.get('/api/db/load-all', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const data = await getAppCloudData(req.user.uid);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error loading app data from PostgreSQL:', error);
      res.status(500).json({ error: error.message || 'Data load failed' });
    }
  });

  // Determine production vs dev environment
  const distPath = path.resolve(process.cwd(), 'dist');
  const distIndexHtml = path.resolve(distPath, 'index.html');
  const hasDist = fs.existsSync(distIndexHtml);
  const isDevMode = process.env.APP_MODE === 'dev' || process.env.npm_lifecycle_event === 'dev';

  if (!isDevMode && hasDist) {
    // Production Mode: Serve pre-built production static files directly
    app.use(express.static(distPath, { maxAge: '1h', index: false }));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      res.sendFile(distIndexHtml);
    });
  } else {
    // Development Mode: Dynamically mount Vite middleware
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite middleware could not be loaded, using static fallback:', viteErr);
      if (hasDist) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => res.sendFile(distIndexHtml));
      }
    }
  }

  // Bind to 0.0.0.0 and PORT for Cloud Run container environment
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (Mode: ${!isDevMode && hasDist ? 'Production' : 'Development'})`);
  });

  server.on('error', (err: any) => {
    console.error('Server listen error:', err);
  });

  // Graceful shutdown handling for Cloud Run
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Gracefully closing server...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(0);
    }, 4000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});

