import mongoose from 'mongoose';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Challenge from '../models/Challenge.js';
import Notification from '../models/Notification.js';
import FriendRequest from '../models/FriendRequest.js';
import {
  becomeFriends,
  endFriendship,
  escapeRegex,
  mapRelations,
  sendFriendRequest,
  withRelation,
} from '../utils/friendship.js';
import { sendPushToUser } from '../utils/pushService.js';

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
    const preview = text.length > 80 ? `${text.slice(0, 77)}…` : text;
    await Notification.create({
      user: req.params.friendId,
      title: `Message from ${req.user.name}`,
      message: preview,
      type: 'system',
      meta: {
        kind: 'chat',
        friendId: req.user._id,
        messageId: message._id,
      },
    });
    sendPushToUser(req.params.friendId, {
      title: `Message from ${req.user.name}`,
      body: preview,
      url: `/campfire?friend=${req.user._id}`,
    }).catch(() => {});
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

function personCard(user) {
  return {
    id: String(user._id),
    name: user.name,
    avatar: user.avatar,
    level: user.level,
    xp: user.xp,
    currentStreak: user.currentStreak,
    coins: user.coins,
  };
}

export const listRequests = async (req, res) => {
  try {
    const incoming = await FriendRequest.find({ to: req.user._id, status: 'pending' })
      .populate('from', 'name avatar level xp currentStreak coins')
      .sort({ createdAt: -1 });
    const outgoing = await FriendRequest.find({ from: req.user._id, status: 'pending' })
      .populate('to', 'name avatar level xp currentStreak coins')
      .sort({ createdAt: -1 });
    res.json({
      incoming: incoming.filter((r) => r.from).map((r) => ({
        id: String(r._id),
        user: personCard(r.from),
        createdAt: r.createdAt,
      })),
      outgoing: outgoing.filter((r) => r.to).map((r) => ({
        id: String(r._id),
        user: personCard(r.to),
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchPeople = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const filter = { isActive: true, _id: { $ne: req.user._id } };
    if (q.includes('@')) {
      filter.email = q.toLowerCase();
    } else {
      filter.name = { $regex: escapeRegex(q), $options: 'i' };
    }

    const users = await User.find(filter)
      .select('name avatar xp level currentStreak coins')
      .limit(20);
    const relations = await mapRelations(
      req.user._id,
      users.map((u) => u._id)
    );
    res.json(users.map((u) => withRelation(personCard(u), relations, req.user._id)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestFriend = async (req, res) => {
  try {
    const userId = req.body?.userId;
    const email = String(req.body?.email || '').trim().toLowerCase();
    let toUser = null;
    if (userId && mongoose.isValidObjectId(userId)) {
      toUser = await User.findById(userId);
    } else if (email) {
      toUser = await User.findOne({ email });
    } else {
      return res.status(400).json({ message: 'Pick someone by name from Heroes, or enter their email.' });
    }
    const result = await sendFriendRequest({
      fromId: req.user._id,
      fromName: req.user.name,
      toUser,
    });
    res.status(result.accepted ? 200 : 201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const respondFriend = async (req, res) => {
  try {
    const { action } = req.body || {};
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Accept or decline the request.' });
    }
    const request = await FriendRequest.findOne({
      _id: req.params.id,
      to: req.user._id,
      status: 'pending',
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.status = action === 'accept' ? 'accepted' : 'declined';
    await request.save();
    if (action === 'accept') {
      await becomeFriends(request.from, request.to);
    }
    await Notification.create({
      user: request.from,
      title: action === 'accept' ? 'Friend request accepted' : 'Friend request declined',
      message:
        action === 'accept'
          ? `${req.user.name} accepted. You can talk in Chat.`
          : `${req.user.name} declined for now.`,
      type: 'system',
      meta: {
        kind: action === 'accept' ? 'friend-accepted' : 'friend-declined',
        friendId: req.user._id,
        requestId: request._id,
      },
    });
    res.json({ message: action === 'accept' ? 'You are now friends' : 'Request declined', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unfriend = async (req, res) => {
  try {
    const friendId = req.params.friendId;
    if (!mongoose.isValidObjectId(friendId)) {
      return res.status(404).json({ message: 'Friend not found' });
    }
    if (String(friendId) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot unfriend yourself.' });
    }

    const me = await User.findById(req.user._id).select('friends name');
    if (!me?.friends?.some((id) => id.equals(friendId))) {
      return res.status(400).json({ message: 'You are not friends with this player.' });
    }

    const friend = await User.findById(friendId).select('name');
    await endFriendship(req.user._id, friendId);

    await Challenge.updateMany(
      {
        status: { $in: ['pending', 'accepted'] },
        $or: [
          { from: req.user._id, to: friendId },
          { from: friendId, to: req.user._id },
        ],
      },
      { $set: { status: 'declined' } }
    );

    await Notification.create({
      user: friendId,
      title: 'Friend removed',
      message: `${req.user.name} removed you from their friends list.`,
      type: 'system',
      meta: { kind: 'unfriended', friendId: req.user._id },
    });

    res.json({
      message: friend?.name ? `Removed ${friend.name} from friends` : 'Friend removed',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
