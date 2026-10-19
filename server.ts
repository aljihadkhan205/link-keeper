import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import type { Request, Response, NextFunction } from 'express';

// Import API handlers
import authStatusHandler from './api/auth/status.js';
import authLoginHandler from './api/auth/login.js';
import authLogoutHandler from './api/auth/logout.js';
import linksHandler from './api/links/index.js';
import singleLinkHandler from './api/links/[id].js';
import linkViewHandler from './api/links/[id]/view.js';
import categoriesHandler from './api/categories/index.js';
import exportHandler from './api/export.js';
import { initDatabase } from './api/_lib/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express 4 doesn't catch rejected promises from async handlers; forward them to the error handler
type Handler = (req: Request, res: Response) => unknown | Promise<unknown>;
const wrap = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res)).catch(next);
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(cookieParser());
  app.use(express.json());

  // Initialize DB on boot
  try {
    await initDatabase();
    console.log('[Link Keeper] Database initialized successfully.');
  } catch (err) {
    console.error('[Link Keeper] Database initialization warning:', err);
  }

  // API Routes
  app.all('/api/auth/status', wrap(authStatusHandler));
  app.all('/api/auth/login', wrap(authLoginHandler));
  app.all('/api/auth/logout', wrap(authLogoutHandler));
  
  app.all('/api/links/:id/view', wrap(linkViewHandler));
  app.all('/api/links/:id', wrap(singleLinkHandler));
  app.all('/api/links', wrap(linksHandler));

  app.all('/api/categories', wrap(categoriesHandler));
  app.all('/api/export', wrap(exportHandler));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Link Keeper API',
      timestamp: new Date().toISOString(),
      database: process.env.TURSO_DATABASE_URL ? 'Turso Cloud' : 'Embedded SQLite/libSQL',
    });
  });

  // Unknown API routes -> JSON 404 (instead of falling through to the SPA)
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  if (!isProduction) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Central error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Link Keeper] Unhandled error:', err);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Link Keeper] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Link Keeper] Fatal server error:', err);
  process.exit(1);
});
