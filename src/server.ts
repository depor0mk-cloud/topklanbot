import './env';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import './bot'; // Import bot to start it
import './cron'; // Import cron jobs

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT as string) || 3000;

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/env', (req, res) => {
    res.json({
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
      hasTelegramToken: !!process.env.TELEGRAM_TOKEN,
    });
  });

  app.get('/api/env2', (req, res) => {
    let isJson = false;
    let fixedKey = process.env.FIREBASE_PRIVATE_KEY || '';
    if (!fixedKey.startsWith('{')) fixedKey = '{' + fixedKey;
    if (!fixedKey.endsWith('}')) fixedKey = fixedKey + '}';
    try {
      JSON.parse(fixedKey);
      isJson = true;
    } catch (e) {}
    res.json({
      isJson,
      startsWith: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 10),
      endsWith: process.env.FIREBASE_PRIVATE_KEY?.substring(process.env.FIREBASE_PRIVATE_KEY.length - 10),
    });
  });

  app.get('/api/test-db', async (req, res) => {
    try {
      const { db } = await import('./firebase');
      const snap = await db.ref('settings').once('value');
      res.json({ status: 'ok', data: snap.val() });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e.message, stack: e.stack });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
