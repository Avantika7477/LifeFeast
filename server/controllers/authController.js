import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken, MOTIVATIONAL_QUOTES } from '../utils/helpers.js';

/** @desc Register new user */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: sanitize(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Login user */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated' });
    }

    res.json({ token: generateToken(user._id), user: sanitize(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Get current profile */
export const getMe = async (req, res) => {
  try {
    const quote = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length];
    res.json({ user: sanitize(req.user), quote });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Update profile */
export const updateProfile = async (req, res) => {
  try {
    const { name, avatar, theme } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (theme) user.theme = theme;
    await user.save();
    res.json({ user: sanitize(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Change password */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Forgot password – generates reset token (demo: returned in response) */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No user with that email' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // In production, email this token. For demo we return it.
    res.json({
      message: 'Password reset token generated',
      resetToken,
      note: 'In production this would be emailed. Use this token with /api/auth/reset-password',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Reset password with token */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.json({ message: 'Password reset successful', token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Delete own account */
export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** @desc Export user data */
export const exportData = async (req, res) => {
  try {
    const Habit = (await import('../models/Habit.js')).default;
    const Task = (await import('../models/Task.js')).default;
    const Journal = (await import('../models/Journal.js')).default;
    const Progress = (await import('../models/Progress.js')).default;

    const [habits, tasks, journals, progress] = await Promise.all([
      Habit.find({ user: req.user._id }),
      Task.find({ user: req.user._id }),
      Journal.find({ user: req.user._id }),
      Progress.find({ user: req.user._id }),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      user: sanitize(req.user),
      habits,
      tasks,
      journals,
      progress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sanitize = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
  xp: user.xp,
  level: user.level,
  coins: user.coins,
  currentStreak: user.currentStreak,
  longestStreak: user.longestStreak,
  badges: user.badges,
  theme: user.theme,
  createdAt: user.createdAt,
});
