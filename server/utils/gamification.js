import User from '../models/User.js';
import Habit from '../models/Habit.js';
import Notification from '../models/Notification.js';
import { BADGE_DEFS } from './helpers.js';

/** Unlock badges based on user streaks and category completions */
export const checkAndUnlockBadges = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return [];

  const habits = await Habit.find({ user: userId });
  const unlocked = [];
  const existingIds = new Set(user.badges.map((b) => b.id));

  const categoryCounts = {};
  habits.forEach((h) => {
    categoryCounts[h.category] = (categoryCounts[h.category] || 0) + h.totalCompletions;
  });

  const checks = {
    '7_day': () => user.currentStreak >= 7 || user.longestStreak >= 7,
    '30_day': () => user.currentStreak >= 30 || user.longestStreak >= 30,
    '100_day': () => user.currentStreak >= 100 || user.longestStreak >= 100,
    early_bird: () =>
      habits.some((h) =>
        h.completions.some((c) => {
          const hour = new Date(c.completedAt).getHours();
          return hour < 8;
        })
      ),
    book_worm: () => (categoryCounts.Reading || 0) >= 10,
    gym_hero: () => (categoryCounts.Fitness || 0) >= 10,
    coding_master: () => (categoryCounts.Coding || 0) >= 10,
    meditation_monk: () => (categoryCounts.Meditation || 0) >= 10,
  };

  for (const def of BADGE_DEFS) {
    if (existingIds.has(def.id)) continue;
    const fn = checks[def.id];
    if (fn && fn()) {
      user.badges.push({
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
      });
      unlocked.push(def);
      await Notification.create({
        user: userId,
        title: 'Achievement Unlocked!',
        message: `You unlocked the "${def.name}" badge! ${def.icon}`,
        type: 'achievement',
        meta: { badgeId: def.id },
      });
    }
  }

  if (unlocked.length) await user.save();
  return unlocked;
};

/** Update user's daily streak when completing habits */
export const updateUserStreak = async (user) => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (user.lastActiveDate === today) return user;

  if (user.lastActiveDate === yesterday) {
    user.currentStreak += 1;
  } else if (user.lastActiveDate !== today) {
    user.currentStreak = 1;
  }

  if (user.currentStreak > user.longestStreak) {
    user.longestStreak = user.currentStreak;
  }
  user.lastActiveDate = today;
  return user;
};
