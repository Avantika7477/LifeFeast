import Notification from '../models/Notification.js';
import Habit from '../models/Habit.js';
import Task from '../models/Task.js';
import PushSubscription from '../models/PushSubscription.js';
import { MOTIVATIONAL_QUOTES, todayStr } from '../utils/helpers.js';
import { formatDueLabel } from '../utils/taskDue.js';
import { sendPushReminders } from '../utils/pushService.js';

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

    const openTasks = await Task.find({ user: req.user._id, status: { $ne: 'completed' } }).limit(5);
    for (const t of openTasks) {
      const when = formatDueLabel(t);
      await Notification.create({
        user: req.user._id,
        title: 'Unfinished task',
        message: when
          ? `${t.title} is still open. Mark it done after ${when}.`
          : `${t.title} is still open on your quest log.`,
        type: 'reminder',
        meta: { taskId: t._id, type: t.type },
      });
    }

    res.json({ message: 'Daily notifications generated', quote });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVapidKey = (_req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY || '';
  res.json({ publicKey: key });
};

export const savePushSubscription = async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Invalid push subscription' });
    }
    const sub = await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: req.user._id, endpoint, keys },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ id: sub._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removePushSubscription = async (req, res) => {
  try {
    const endpoint = req.body?.endpoint;
    if (endpoint) {
      await PushSubscription.deleteOne({ user: req.user._id, endpoint });
    } else {
      await PushSubscription.deleteMany({ user: req.user._id });
    }
    res.json({ message: 'Unsubscribed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const runPushReminders = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const provided = req.get('x-cron-secret') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (secret && provided !== secret) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const result = await sendPushReminders();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
