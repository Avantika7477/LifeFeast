import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import missionRoutes from './routes/missionRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../client/dist');
const clientIndex = path.join(clientDist, 'index.html');
const hasClient = fs.existsSync(clientIndex);

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    'https://lifefeast.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter(Boolean),
);

function isAllowedOrigin(origin) {
  if (!origin || allowedOrigins.has(origin)) return true;
  try {
    return new URL(origin).hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));

/** Health must not crash the function if Atlas is misconfigured. */
app.get('/api/health', async (_req, res) => {
  try {
    await connectDB();
    res.json({
      status: 'ok',
      app: 'LifeQuest',
      db: mongoose.connection.readyState === 1 ? 'up' : 'down',
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      app: 'LifeQuest',
      db: 'down',
      message: error.message,
    });
  }
});

async function requireDb(_req, res, next) {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({
      message: error.message || 'Database unavailable. Set MONGODB_URI in Vercel.',
    });
  }
}

app.use('/api/auth', requireDb, authRoutes);
app.use('/api/habits', requireDb, habitRoutes);
app.use('/api/tasks', requireDb, taskRoutes);
app.use('/api/progress', requireDb, progressRoutes);
app.use('/api/journal', requireDb, journalRoutes);
app.use('/api/notifications', requireDb, notificationRoutes);
app.use('/api/missions', requireDb, missionRoutes);
app.use('/api/leaderboard', requireDb, leaderboardRoutes);
app.use('/api/admin', requireDb, adminRoutes);
app.use('/api/social', requireDb, socialRoutes);
app.use('/api/feedback', requireDb, feedbackRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

if (hasClient) {
  app.use(
    express.static(clientDist, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );
  // SPA fallback for app routes only — never return index.html for missing JS/CSS
  // (that combination causes a blank white screen on phones after a deploy).
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    if (req.path.startsWith('/assets/')) {
      return res.status(404).type('text/plain').send('Not found');
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(clientIndex);
  });
}

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const isCors = err.message?.includes('not allowed by CORS');
  res.status(isCors ? 403 : 500).json({ message: err.message || 'Server error' });
});

export default app;

if (!process.env.VERCEL) {
  try {
    await connectDB();
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeQuest API running on port ${PORT}`);
    if (hasClient) console.log(`Serving client from ${clientDist}`);
  });
  const { sendPushReminders } = await import('./utils/pushService.js');
  setInterval(() => {
    sendPushReminders().catch((error) => console.warn(`Push reminders: ${error.message}`));
  }, 5 * 60 * 1000);
}
