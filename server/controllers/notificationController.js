import Notification from '../models/Notification.js';
import Habit from '../models/Habit.js';
import { MOTIVATIONAL_QUOTES, todayStr } from '../utils/helpers.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: 'Not found' });
    res.json(n);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Generate daily motivation + missed habit reminders */
export const generateDaily = async (req, res) => {
  try {
    const today = todayStr();
    const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

    await Notification.create({
      user: req.user._id,
      title: 'Daily Motivation',
      message: `"${quote.quote}" — ${quote.author}`,
      type: 'motivation',
    });

    const habits = await Habit.find({ user: req.user._id, isActive: true });
    const missed = habits.filter((h) => !h.completions.some((c) => c.date === today));

    for (const h of missed.slice(0, 3)) {
      await Notification.create({
        user: req.user._id,
        title: 'Missed Habit Reminder',
        message: `Don't forget: ${h.name}${h.reminderTime ? ` (reminder at ${h.reminderTime})` : ''}`,
        type: 'missed',
        meta: { habitId: h._id },
      });
    }

    // Reminder notifications for habits with reminderTime
    for (const h of habits.filter((x) => x.reminderTime)) {
      await Notification.create({
        user: req.user._id,
        title: 'Habit Reminder',
        message: `Time for: ${h.name} at ${h.reminderTime}`,
        type: 'reminder',
        meta: { habitId: h._id, time: h.reminderTime },
      });
    }

    res.json({ message: 'Daily notifications generated', quote });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
