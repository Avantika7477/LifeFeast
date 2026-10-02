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

- Node.js 18+
- MongoDB running locally (or set `MONGODB_URI` in `server/.env`)

## Setup

### 1. Backend

```bash
cd server
npm install
# Edit .env if needed (MongoDB URI, JWT secret)
npm run seed   # creates admin@lifequest.app / admin123 and demo@lifequest.app / demo123
npm run dev
```

API runs at `http://localhost:5000`.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at `http://localhost:5173`.

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
├── client/          # React Vite SPA
│   └── src/
│       ├── api/     # Axios API layer
│       ├── components/
│       ├── context/ # Auth & Theme
│       ├── pages/
│       └── styles/
└── server/          # Express REST API
    ├── models/
    ├── controllers/
    ├── routes/
    └── middleware/
```

## Environment

**server/.env**
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/lifequest
JWT_SECRET=your_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

**client/.env**
```
VITE_API_URL=http://localhost:5000/api
```
