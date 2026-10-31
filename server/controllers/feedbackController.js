import Feedback from '../models/Feedback.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const TITLE_MAX = 80;
const MESSAGE_MAX = 2000;
const DAILY_LIMIT = 8;

function publicUser(user) {
  if (!user || typeof user !== 'object') return { name: 'Hero' };
  return { name: user.name || 'Hero', avatar: user.avatar || '' };
}

function publicCard(doc) {
  return {
    _id: doc._id,
    kind: doc.kind,
    rating: doc.rating || null,
    title: doc.title || '',
    message: doc.message,
    createdAt: doc.createdAt,
    user: publicUser(doc.user),
  };
}

function ownerCard(doc) {
  return {
    ...publicCard(doc),
    reverted: Boolean(doc.reverted),
  };
}

function adminCard(doc) {
  const user =
    doc.user && typeof doc.user === 'object'
      ? { _id: doc.user._id, name: doc.user.name, email: doc.user.email, avatar: doc.user.avatar || '' }
      : { name: 'Deleted user', email: '' };
  return {
    _id: doc._id,
    kind: doc.kind,
    rating: doc.rating || null,
    title: doc.title || '',
    message: doc.message,
    createdAt: doc.createdAt,
    reverted: Boolean(doc.reverted),
    revertedAt: doc.revertedAt || null,
    seenByAdmin: Boolean(doc.seenByAdmin),
    user,
  };
}

async function asAdminCard(id) {
  const full = await Feedback.findById(id).populate('user', 'name email avatar');
  return adminCard(full);
}

async function notifyAdmins({ fromId, fromName, kind, feedbackId }) {
  const admins = await User.find({
    role: 'admin',
    isActive: true,
    _id: { $ne: fromId },
  }).select('_id');
  if (!admins.length) return;
  await Notification.insertMany(
    admins.map((admin) => ({
      user: admin._id,
      title: kind === 'review' ? 'New review' : 'Private improvement note',
      message:
        kind === 'review'
          ? `${fromName} posted a review on the feedback wall.`
          : `${fromName} sent a private note about what to improve.`,
      type: 'system',
      meta: { kind: 'feedback', feedbackId, feedbackKind: kind },
    })),
  );
}

export const getPublicReviews = async (req, res) => {
  try {
    const [reviews, stats] = await Promise.all([
      Feedback.find({ kind: 'review', reverted: false })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(100),
      Feedback.aggregate([
        { $match: { kind: 'review', reverted: false, rating: { $gte: 1 } } },
        { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } },
      ]),
    ]);

    res.json({
      reviews: reviews.map(publicCard),
      stats: {
        count: stats[0]?.count || 0,
        average: stats[0] ? Math.round(stats[0].avg * 10) / 10 : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyFeedback = async (req, res) => {
  try {
    const items = await Feedback.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(items.map(ownerCard));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createFeedback = async (req, res) => {
  try {
    const kind = req.body.kind === 'improve' ? 'improve' : 'review';
    const title = String(req.body.title || '').trim().slice(0, TITLE_MAX);
    const message = String(req.body.message || '').trim();

    if (message.length < 8) {
      return res.status(400).json({ message: 'Write a bit more so we can understand you.' });
    }
    if (message.length > MESSAGE_MAX) {
      return res.status(400).json({ message: `Keep it under ${MESSAGE_MAX} characters.` });
    }

    let rating;
    if (kind === 'review') {
      rating = Number(req.body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Pick a rating from 1 to 5 stars.' });
      }
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await Feedback.countDocuments({
      user: req.user._id,
      createdAt: { $gte: startOfDay },
    });
    if (todayCount >= DAILY_LIMIT) {
      return res.status(429).json({ message: 'You have sent enough notes today. Try again tomorrow.' });
    }

    const item = await Feedback.create({
      user: req.user._id,
      kind,
      rating,
      title,
      message,
    });

    await notifyAdmins({
      fromId: req.user._id,
      fromName: req.user.name,
      kind,
      feedbackId: item._id,
    });

    res.status(201).json(ownerCard(item));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMyFeedback = async (req, res) => {
  try {
    const item = await Feedback.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ message: 'Feedback not found' });
    await item.deleteOne();
    res.json({ message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminFeedback = async (req, res) => {
  try {
    const { kind, status } = req.query;
    const filter = {};
    if (kind === 'review' || kind === 'improve') filter.kind = kind;
    if (status === 'reverted') filter.reverted = true;
    else if (status === 'open') filter.reverted = false;

    const [items, unseen, open, reverted, reviews, improve] = await Promise.all([
      Feedback.find(filter).populate('user', 'name email avatar').sort({ createdAt: -1 }).limit(200),
      Feedback.countDocuments({ seenByAdmin: false, reverted: false }),
      Feedback.countDocuments({ reverted: false }),
      Feedback.countDocuments({ reverted: true }),
      Feedback.countDocuments({ kind: 'review' }),
      Feedback.countDocuments({ kind: 'improve' }),
    ]);

    res.json({
      items: items.map(adminCard),
      stats: { unseen, open, reverted, reviews, improve },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeedbackUnreadCount = async (req, res) => {
  try {
    const count = await Feedback.countDocuments({ seenByAdmin: false, reverted: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markFeedbackSeen = async (req, res) => {
  try {
    await Feedback.updateMany({ seenByAdmin: false }, { seenByAdmin: true });
    res.json({ message: 'Marked seen' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const revertFeedback = async (req, res) => {
  try {
    const item = await Feedback.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Feedback not found' });
    item.reverted = true;
    item.revertedAt = new Date();
    item.revertedBy = req.user._id;
    item.seenByAdmin = true;
    await item.save();
    res.json(await asAdminCard(item._id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const restoreFeedback = async (req, res) => {
  try {
    const item = await Feedback.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Feedback not found' });
    item.reverted = false;
    item.revertedAt = undefined;
    item.revertedBy = undefined;
    await item.save();
    res.json(await asAdminCard(item._id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
