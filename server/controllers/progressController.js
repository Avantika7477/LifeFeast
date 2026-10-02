import Habit from '../models/Habit.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import { todayStr } from '../utils/helpers.js';

/** @desc Dashboard summary stats */
export const getDashboard = async (req, res) => {
  try {
    const user = req.user;
    const today = todayStr();
    const habits = await Habit.find({ user: user._id, isActive: true });
    const completedToday = habits.filter((h) => h.completions.some((c) => c.date === today)).length;
    const dailyProgress = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;

    // Monthly progress
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    let monthCompleted = 0;
    let monthPossible = 0;
    habits.forEach((h) => {
      for (let d = 1; d <= now.getDate(); d++) {
        const date = `${monthPrefix}-${String(d).padStart(2, '0')}`;
        monthPossible += 1;
        if (h.completions.some((c) => c.date === date)) monthCompleted += 1;
      }
    });
    const monthlyProgress = monthPossible ? Math.round((monthCompleted / monthPossible) * 100) : 0;

    const xpForNext = user.getXpForLevel(user.level + 1);
    const xpForCurrent = user.getXpForLevel(user.level);
    const xpProgress = Math.min(
      100,
      Math.round(((user.xp - xpForCurrent) / (xpForNext - xpForCurrent || 1)) * 100)
    );

    res.json({
      welcome: `Welcome ${user.name}`,
      level: user.level,
      xp: user.xp,
      xpProgress,
      xpForNext,
      currentStreak: user.currentStreak,
      coins: user.coins,
      dailyProgress,
      monthlyProgress,
      today,
      habitsTotal: habits.length,
      habitsCompletedToday: completedToday,
      badges: user.badges,
      longestStreak: user.longestStreak,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Calendar data for a month */
export const getCalendar = async (req, res) => {
  try {
    const { year, month } = req.query; // month 1-12
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const daysInMonth = new Date(y, m, 0).getDate();
    const prefix = `${y}-${String(m).padStart(2, '0')}`;

    const habits = await Habit.find({ user: req.user._id, isActive: true });
    const days = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${prefix}-${String(d).padStart(2, '0')}`;
      const completed = [];
      const missed = [];
      habits.forEach((h) => {
        const done = h.completions.some((c) => c.date === date);
        if (done) completed.push({ id: h._id, name: h.name, category: h.category });
        else if (date <= todayStr()) missed.push({ id: h._id, name: h.name, category: h.category });
      });
      const total = habits.length;
      const pct = total ? Math.round((completed.length / total) * 100) : 0;
      days.push({ date, completed, missed, completionPercentage: pct, completedCount: completed.length, total });
    }

    res.json({ year: y, month: m, days });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Day detail */
export const getDayDetail = async (req, res) => {
  try {
    const { date } = req.params;
    const habits = await Habit.find({ user: req.user._id, isActive: true });
    const completed = habits
      .filter((h) => h.completions.some((c) => c.date === date))
      .map((h) => ({
        id: h._id,
        name: h.name,
        category: h.category,
        difficulty: h.difficulty,
        completedAt: h.completions.find((c) => c.date === date)?.completedAt,
      }));
    res.json({ date, completed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Full analytics payload */
export const getAnalytics = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id, isActive: true });
    const progress = await Progress.find({ user: req.user._id }).sort({ date: 1 });
    const today = todayStr();

    // Daily (last 7 days)
    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const p = progress.find((x) => x.date === d);
      const completed = habits.filter((h) => h.completions.some((c) => c.date === d)).length;
      daily.push({
        date: d,
        label: d.slice(5),
        completion: habits.length ? Math.round((completed / habits.length) * 100) : 0,
        xp: p?.xpEarned || 0,
      });
    }

    // Weekly (last 8 weeks)
    const weekly = [];
    for (let w = 7; w >= 0; w--) {
      let sum = 0;
      let count = 0;
      for (let d = 0; d < 7; d++) {
        const date = new Date(Date.now() - (w * 7 + d) * 86400000).toISOString().slice(0, 10);
        const completed = habits.filter((h) => h.completions.some((c) => c.date === date)).length;
        if (habits.length) {
          sum += (completed / habits.length) * 100;
          count += 1;
        }
      }
      weekly.push({
        label: `W${8 - w}`,
        completion: count ? Math.round(sum / count) : 0,
      });
    }

    // Monthly (last 12 months)
    const monthly = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = dt.getFullYear();
      const m = dt.getMonth() + 1;
      const prefix = `${y}-${String(m).padStart(2, '0')}`;
      let completed = 0;
      let total = 0;
      habits.forEach((h) => {
        h.completions.forEach((c) => {
          if (c.date.startsWith(prefix)) completed += 1;
        });
        const daysInM = new Date(y, m, 0).getDate();
        const isCurrent = y === now.getFullYear() && m === now.getMonth() + 1;
        total += isCurrent ? now.getDate() : daysInM;
      });
      monthly.push({
        label: dt.toLocaleString('default', { month: 'short' }),
        completion: total ? Math.round((completed / total) * 100) : 0,
      });
    }

    // Yearly
    const yearlyMap = {};
    habits.forEach((h) => {
      h.completions.forEach((c) => {
        const y = c.date.slice(0, 4);
        yearlyMap[y] = (yearlyMap[y] || 0) + 1;
      });
    });
    const yearly = Object.entries(yearlyMap).map(([year, count]) => ({ year, count }));

    // Category pie
    const catMap = {};
    habits.forEach((h) => {
      catMap[h.category] = (catMap[h.category] || 0) + h.totalCompletions;
    });
    const pie = Object.entries(catMap).map(([name, value]) => ({ name, value }));

    // Heatmap (last 90 days)
    const heatmap = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const completed = habits.filter((h) => h.completions.some((c) => c.date === d)).length;
      heatmap.push({
        date: d,
        count: completed,
        rate: habits.length ? Math.round((completed / habits.length) * 100) : 0,
      });
    }

    // Best / worst habit
    const ranked = [...habits].sort((a, b) => b.totalCompletions - a.totalCompletions);
    const bestHabit = ranked[0] ? { name: ranked[0].name, completions: ranked[0].totalCompletions } : null;
    const worstHabit = ranked.length
      ? { name: ranked[ranked.length - 1].name, completions: ranked[ranked.length - 1].totalCompletions }
      : null;

    const avgCompletion =
      progress.length
        ? Math.round(progress.reduce((s, p) => s + p.completionRate, 0) / progress.length)
        : 0;

    res.json({
      daily,
      weekly,
      monthly,
      yearly,
      pie,
      heatmap,
      longestStreak: req.user.longestStreak,
      averageCompletion: avgCompletion,
      bestHabit,
      worstHabit,
      totalHabits: habits.length,
      totalXp: req.user.xp,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
