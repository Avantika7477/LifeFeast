import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (a, b) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};

/** Badge definitions unlocked by progress milestones */
export const BADGE_DEFS = [
  { id: '7_day', name: '7 Day Streak', description: 'Maintain a 7-day streak', icon: '🔥', check: (u) => u.currentStreak >= 7 || u.longestStreak >= 7 },
  { id: '30_day', name: '30 Day Streak', description: 'Maintain a 30-day streak', icon: '⚡', check: (u) => u.currentStreak >= 30 || u.longestStreak >= 30 },
  { id: '100_day', name: '100 Day Streak', description: 'Maintain a 100-day streak', icon: '💎', check: (u) => u.currentStreak >= 100 || u.longestStreak >= 100 },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a habit before 8 AM', icon: '🌅', check: () => false },
  { id: 'book_worm', name: 'Book Worm', description: 'Complete 10 Reading habits', icon: '📚', check: () => false },
  { id: 'gym_hero', name: 'Gym Hero', description: 'Complete 10 Fitness habits', icon: '💪', check: () => false },
  { id: 'coding_master', name: 'Coding Master', description: 'Complete 10 Coding habits', icon: '💻', check: () => false },
  { id: 'meditation_monk', name: 'Meditation Monk', description: 'Complete 10 Meditation habits', icon: '🧘', check: () => false },
];

export const MISSION_TEMPLATES = [
  { title: 'Drink Water', description: 'Drink at least 8 glasses of water', coinReward: 10, xpReward: 10 },
  { title: 'Exercise', description: 'Do at least 20 minutes of exercise', coinReward: 15, xpReward: 20 },
  { title: 'Read', description: 'Read for 15 minutes', coinReward: 10, xpReward: 15 },
  { title: 'Study React', description: 'Study React for 30 minutes', coinReward: 20, xpReward: 25 },
  { title: 'Sleep Before 11 PM', description: 'Get to bed before 11 PM', coinReward: 15, xpReward: 15 },
];

export const MOTIVATIONAL_QUOTES = [
  { quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { quote: 'Small daily improvements are the key to staggering long-term results.', author: 'Unknown' },
  { quote: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { quote: 'Your future is created by what you do today, not tomorrow.', author: 'Robert Kiyosaki' },
  { quote: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { quote: 'Don’t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { quote: 'It always seems impossible until it’s done.', author: 'Nelson Mandela' },
  { quote: 'Progress, not perfection.', author: 'Unknown' },
];
