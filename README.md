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
- MongoDB running locally (or set `MONGODB_URI` in `server/.env`)

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

- API: `http://localhost:5000`
- App: `http://localhost:5173`

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
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/lifequest
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

**client/.env.example**
```
VITE_API_URL=http://localhost:5000/api
```
