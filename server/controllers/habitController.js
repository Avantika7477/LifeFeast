import Habit from '../models/Habit.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Notification from '../models/Notification.js';
import { todayStr } from '../utils/helpers.js';
import { checkAndUnlockBadges, updateUserStreak } from '../utils/gamification.js';

/** @desc Get all habits for user */
export const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id, isActive: true }).sort({ createdAt: -1 });
    const today = todayStr();
    const enriched = habits.map((h) => {
      const obj = h.toObject();
      obj.completedToday = h.completions.some((c) => c.date === today);
      obj.xpReward = h.getXpReward();
      return obj;
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Create habit */
export const createHabit = async (req, res) => {
  try {
    const habit = await Habit.create({ ...req.body, user: req.user._id });
    res.status(201).json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Update habit */
export const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    const fields = ['name', 'description', 'category', 'difficulty', 'target', 'reminderTime', 'color', 'icon', 'isActive'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) habit[f] = req.body[f];
    });
    await habit.save();
    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Delete habit */
export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    res.json({ message: 'Habit deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Toggle habit completion for today */
export const completeHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    const today = todayStr();
    const already = habit.completions.findIndex((c) => c.date === today);
    const user = await User.findById(req.user._id);
    let xpGained = 0;
    let leveledUp = false;
    let coinsGained = 0;

    if (already >= 0) {
      // Uncomplete
      habit.completions.splice(already, 1);
      habit.totalCompletions = Math.max(0, habit.totalCompletions - 1);
      habit.currentStreak = Math.max(0, habit.currentStreak - 1);
      await habit.save();
      return res.json({ habit, completed: false, xpGained: 0, leveledUp: false });
    }

    habit.completions.push({ date: today });
    habit.totalCompletions += 1;

    // Habit streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const hadYesterday = habit.completions.some((c) => c.date === yesterday);
    habit.currentStreak = hadYesterday || habit.currentStreak === 0 ? habit.currentStreak + 1 : 1;
    if (habit.currentStreak > habit.longestStreak) habit.longestStreak = habit.currentStreak;

    xpGained = habit.getXpReward();
    leveledUp = user.addXp(xpGained);
    coinsGained = Math.floor(xpGained / 5);
    user.coins += coinsGained;
    await updateUserStreak(user);

    await habit.save();
    await user.save();

    // Update daily progress
    const allHabits = await Habit.find({ user: user._id, isActive: true });
    const completedToday = allHabits.filter((h) =>
      h.completions.some((c) => c.date === today)
    ).length;
    await Progress.findOneAndUpdate(
      { user: user._id, date: today },
      {
        habitsCompleted: completedToday,
        habitsTotal: allHabits.length,
        completionRate: allHabits.length ? Math.round((completedToday / allHabits.length) * 100) : 0,
        $inc: { xpEarned: xpGained, coinsEarned: coinsGained },
      },
      { upsert: true, new: true }
    );

    const newBadges = await checkAndUnlockBadges(user._id);

    if (habit.reminderTime) {
      // noop – reminders handled client-side / notifications route
    }

    if (leveledUp) {
      await Notification.create({
        user: user._id,
        title: 'Level Up!',
        message: `Congratulations! You reached Level ${user.level}!`,
        type: 'achievement',
      });
    }

    res.json({
      habit: { ...habit.toObject(), completedToday: true, xpReward: habit.getXpReward() },
      completed: true,
      xpGained,
      coinsGained,
      leveledUp,
      newLevel: user.level,
      newXp: user.xp,
      newCoins: user.coins,
      newBadges,
      userStreak: user.currentStreak,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Get single habit */
export const getHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
