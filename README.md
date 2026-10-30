# LifeQuest — Gamified Habit Tracker

Turn your daily life into a game. Track habits, earn XP, unlock badges, complete missions, and climb the leaderboard.

## Tech Stack

- **Frontend:** React (Vite), CSS (glassmorphism dark UI), Framer Motion, Recharts, React Router
- **Backend:** Node.js, Express.js, MongoDB, JWT Authentication

## Features

- Auth: Login, Register, Forgot/Reset Password, Protected Routes
- Dashboard with level, XP, streak, coins, daily/monthly progress & motivational quote
- Habit CRUD with categories, difficulty, targets, reminders, progress rings
- Calendar view with completion % and day details
- Analytics: daily/weekly/monthly/yearly charts, pie chart, heatmap
- Gamification: XP, levels, badges, daily missions, coins
- Leaderboard (global & friends)
- Tasks (daily / weekly / monthly), Journal & Mood tracker
- Notifications, Settings (theme, password, export, delete account)
- Admin panel for users, analytics, badges & reports

## Prerequisites

- Node.js 20.19+ or 22.12+ (Vite 8 and Mongoose 9 will not install on Node 18)
- MongoDB is optional. If nothing is running on port 27017, the API starts an embedded MongoDB automatically.

## Setup

Copy the env templates first:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Then edit `server/.env` if your MongoDB URI or JWT secret differ from the defaults.

### Install and run from the repo root

This repo is an npm workspace (`client`, `server`, `documentation`). One install at the root is enough:

```bash
npm install
npm run seed         # creates admin@lifequest.app / admin123 and demo@lifequest.app / demo123
npm run dev          # starts API + Vite together
```

- API: `http://localhost:5001` (5000 is often taken by macOS AirPlay)
- App: `http://localhost:5173`

The client is an installable PWA. On Chrome/Edge, use **Install app** (address bar or Settings). On iPhone, use **Share → Add to Home Screen**. API calls stay online; only the app shell is cached.

Run one side only with `npm run dev:server` or `npm run dev:client`.

### Demo accounts

| Role  | Email                 | Password  |
|-------|-----------------------|-----------|
| Admin | admin@lifequest.app   | admin123  |
| Demo  | demo@lifequest.app    | demo123   |

## XP Rewards

| Difficulty | XP |
|------------|----|
| Easy       | 10 |
| Medium     | 20 |
| Hard       | 40 |

## Project Structure

```
LifeQuest/
├── package.json            # npm workspaces (client, server, documentation)
├── package-lock.json
├── client/                 # React Vite SPA
│   ├── public/
│   ├── .env.example
│   └── src/
│       ├── api/            # Axios API layer
│       ├── components/
│       ├── context/        # Auth & Theme
│       ├── pages/
│       ├── styles/
│       └── utils/
├── server/                 # Express REST API
│   ├── .env.example
│   ├── config/             # MongoDB connection
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── index.js
│   └── seed.js
└── documentation/          # HTML guide + PDF generator (not app runtime)
```

## Environment

Copy from the example files. Do not commit `.env`.

**server/.env.example**
```
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/lifequest
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

**client/.env.example**
```
VITE_API_URL=http://localhost:5001/api
```

Leave `VITE_API_URL` unset on the host. Production builds then call same-origin `/api`.

## Deploy (one URL)

The production server serves the API and the built React app together. Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free M0). Do not use the local embedded MongoDB in production.

### 1. Atlas

1. Create a free cluster.
2. Add a database user.
3. Network Access → allow `0.0.0.0/0` (or your host IPs).
4. Copy the `mongodb+srv://...` URI and append `/lifequest`.

### 2. Render

1. Push this repo to GitHub.
2. Render → **New → Blueprint** and select the repo (`render.yaml`), or **New Web Service** with:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Node 22
   - Health check: `/api/health`
3. Set env vars:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://USER:PASS@cluster.../lifequest
JWT_SECRET=<long random string>
JWT_EXPIRE=7d
CLIENT_URL=https://your-service.onrender.com
```

Render also sets `RENDER_EXTERNAL_URL`; CORS uses that automatically.

4. After the first deploy, open the Render **Shell** and run `npm run seed` once if you want the demo accounts.

Open `https://your-service.onrender.com` — the UI, `/api/health`, and PWA install all use that origin.

### Vercel (same GitHub repo)

This repo includes `vercel.json` so Vercel **Services** can import `client` (Vite) and `server` (Express) as one project.

1. Refresh the Vercel import page after this file is on `main`.
2. Root Directory: `./`
3. Do **not** import `client` and `server` as two separate projects.
4. Add env vars on the Vercel project (Production + Preview):

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://USER:PASS@cluster.../lifequest
JWT_SECRET=<long random string>
JWT_EXPIRE=7d
CLIENT_URL=https://your-project.vercel.app
```

Leave `VITE_API_URL` unset so the UI calls same-origin `/api`.

5. Deploy, then run `npm run seed` locally against Atlas (or a one-off machine) if you want demo accounts. Vercel has no persistent shell like Render.

### Local production check

```bash
npm run build
npm start
```

Then visit `http://localhost:5001`.
