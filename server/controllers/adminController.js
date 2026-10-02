import User from '../models/User.js';
import Habit from '../models/Habit.js';
import Progress from '../models/Progress.js';
import { BADGE_DEFS } from '../utils/helpers.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -resetPasswordToken')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own admin account here' });
    }
    await User.findByIdAndDelete(req.params.id);
    await Habit.deleteMany({ user: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ id: user._id, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalHabits = await Habit.countDocuments();
    const recentProgress = await Progress.find().sort({ date: -1 }).limit(30);

    const avgCompletion =
      recentProgress.length
        ? Math.round(recentProgress.reduce((s, p) => s + p.completionRate, 0) / recentProgress.length)
        : 0;

    const topUsers = await User.find({ isActive: true })
      .select('name xp level currentStreak')
      .sort({ xp: -1 })
      .limit(10);

    res.json({
      totalUsers,
      activeUsers,
      totalHabits,
      avgCompletion,
      topUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBadges = async (req, res) => {
  res.json(BADGE_DEFS.map(({ id, name, description, icon }) => ({ id, name, description, icon })));
};

export const getReports = async (req, res) => {
  try {
    const users = await User.find().select('name email xp level currentStreak createdAt isActive');
    const habits = await Habit.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, completions: { $sum: '$totalCompletions' } } },
    ]);
    res.json({ users, habitCategories: habits, generatedAt: new Date() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
