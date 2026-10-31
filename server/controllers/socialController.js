import mongoose from 'mongoose';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Challenge from '../models/Challenge.js';
import Notification from '../models/Notification.js';

async function assertFriends(userId, friendId) {
  if (!mongoose.isValidObjectId(friendId)) {
    const err = new Error('Friend not found');
    err.status = 404;
    throw err;
  }
  if (String(userId) === String(friendId)) {
    const err = new Error('Pick a friend, not yourself.');
    err.status = 400;
    throw err;
  }
  const user = await User.findById(userId).select('friends');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  if (!user.friends.some((id) => id.equals(friendId))) {
    const err = new Error('You can only chat with friends. Add them on Heroes first.');
    err.status = 403;
    throw err;
  }
}

export const listFriends = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate(
      'friends',
      'name avatar level xp currentStreak isActive'
    );
    const friends = (me.friends || []).filter((f) => f && f.isActive !== false);
    const items = await Promise.all(
      friends.map(async (friend) => {
        const last = await Message.findOne({
          $or: [
            { from: req.user._id, to: friend._id },
            { from: friend._id, to: req.user._id },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();
        const unread = await Message.countDocuments({
          from: friend._id,
          to: req.user._id,
          read: false,
        });
        return {
          id: String(friend._id),
          name: friend.name,
          avatar: friend.avatar,
          level: friend.level,
          lastMessage: last?.text || '',
          lastAt: last?.createdAt || null,
          unread,
        };
      })
    );
    items.sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0));
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    await assertFriends(req.user._id, req.params.friendId);
    const messages = await Message.find({
      $or: [
        { from: req.user._id, to: req.params.friendId },
        { from: req.params.friendId, to: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100);
    await Message.updateMany(
      { from: req.params.friendId, to: req.user._id, read: false },
      { read: true }
    );
    res.json(messages);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Write a message first.' });
    if (text.length > 500) return res.status(400).json({ message: 'Keep it under 500 characters.' });
    await assertFriends(req.user._id, req.params.friendId);
    const message = await Message.create({
      from: req.user._id,
      to: req.params.friendId,
      text,
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const listChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({
      $or: [{ from: req.user._id }, { to: req.user._id }],
    })
      .populate('from', 'name')
      .populate('to', 'name')
      .sort({ createdAt: -1 })
      .limit(40);
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendChallenge = async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const to = req.body?.to;
    if (!title || !to) return res.status(400).json({ message: 'Pick a friend and a challenge title.' });
    await assertFriends(req.user._id, to);
    const challenge = await Challenge.create({
      from: req.user._id,
      to,
      title,
      description,
    });
    await Notification.create({
      user: to,
      title: 'New challenge',
      message: `${req.user.name} challenged you: ${title}`,
      type: 'system',
      meta: { challengeId: challenge._id, friendId: req.user._id, kind: 'challenge' },
    });
    const full = await Challenge.findById(challenge._id).populate('from', 'name').populate('to', 'name');
    res.status(201).json(full);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const respondChallenge = async (req, res) => {
  try {
    const { action } = req.body || {};
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Accept or decline the challenge.' });
    }
    const challenge = await Challenge.findOne({ _id: req.params.id, to: req.user._id, status: 'pending' });
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    challenge.status = action === 'accept' ? 'accepted' : 'declined';
    await challenge.save();
    await Notification.create({
      user: challenge.from,
      title: action === 'accept' ? 'Challenge accepted' : 'Challenge declined',
      message: `${req.user.name} ${action === 'accept' ? 'accepted' : 'declined'} “${challenge.title}”.`,
      type: 'system',
      meta: { challengeId: challenge._id, friendId: req.user._id, kind: 'challenge' },
    });
    const full = await Challenge.findById(challenge._id).populate('from', 'name').populate('to', 'name');
    res.json(full);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ _id: req.params.id, to: req.user._id, status: 'accepted' });
    if (!challenge) return res.status(404).json({ message: 'Challenge not found or not accepted yet' });
    challenge.status = 'completed';
    await challenge.save();

    const [me, friend] = await Promise.all([
      User.findById(req.user._id),
      User.findById(challenge.from),
    ]);
    const meLeveled = me.addXp(challenge.xpReward);
    me.coins += challenge.coinReward;
    let friendLeveled = false;
    if (friend) {
      friendLeveled = friend.addXp(Math.round(challenge.xpReward / 2));
      friend.coins += Math.round(challenge.coinReward / 2);
      await friend.save();
    }
    await me.save();

    await Notification.create({
      user: challenge.from,
      title: 'Challenge completed',
      message: `${req.user.name} finished “${challenge.title}”. You both earned a reward.`,
      type: 'achievement',
      meta: { challengeId: challenge._id, friendId: req.user._id, kind: 'challenge' },
    });

    const full = await Challenge.findById(challenge._id).populate('from', 'name').populate('to', 'name');
    res.json({
      challenge: full,
      user: { coins: me.coins, xp: me.xp, level: me.level },
      leveledUp: meLeveled || friendLeveled,
      coinsGained: challenge.coinReward,
      xpGained: challenge.xpReward,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
