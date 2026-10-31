import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();
await connectDB();


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

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'LifeQuest' }));

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/social', socialRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

if (hasClient) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
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
