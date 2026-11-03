import Achievement from '../models/Achievement.js';
import Habit from '../models/Habit.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { todayStr } from '../utils/helpers.js';
import {
  STARTER_COMPANION,
  catalog,
  equippedId,
  findCompanion,
  ownedList,
  weekUnlocked,
} from '../utils/companions.js';

const REACTIONS = new Set(['cheer', 'keep', 'gotthis']);
const AUTHOR_SELECT = 'name avatar level currentStreak equippedCompanion companions';

function ensureCompanions(user) {
  if (!Array.isArray(user.companions) || !user.companions.length) {
    user.companions = [STARTER_COMPANION];
  }
  if (!user.equippedCompanion) user.equippedCompanion = STARTER_COMPANION;
  return user;
}

function shopPayload(user) {
  const owned = ownedList(user);
  const unlocked = weekUnlocked(user);
  return {
    streak: user.currentStreak || 0,
    weekUnlocked: unlocked,
    coins: user.coins || 0,
    equipped: equippedId(user),
    owned,
    catalog: catalog().map((item) => ({
      ...item,
      owned: owned.includes(item.id),
      available: item.cost === 0 || unlocked,
    })),
  };
}

function shapePost(doc, meId) {
  const reactions = doc.reactions || [];
  const counts = { cheer: 0, keep: 0, gotthis: 0 };
  let mine = null;
  for (const reaction of reactions) {
    if (counts[reaction.kind] !== undefined) counts[reaction.kind] += 1;
    if (String(reaction.user) === String(meId)) mine = reaction.kind;
  }
  const author = doc.user && typeof doc.user === 'object' ? doc.user : null;
  return {
    id: String(doc._id),
    date: doc.date,
    text: doc.text,
    habitsDone: doc.habitsDone,
    habitsTotal: doc.habitsTotal,
    streak: doc.streak,
    xp: doc.xp,
    companion: doc.companion || STARTER_COMPANION,
    createdAt: doc.createdAt,
    mine: author ? String(author._id) === String(meId) : String(doc.user) === String(meId),
    author: author
      ? {
          id: String(author._id),
          name: author.name,
          level: author.level,
          streak: author.currentStreak,
        }
      : null,
    counts,
    mineReaction: mine,
  };
}

async function todaySnapshot(user) {
  const today = todayStr();
  const habits = await Habit.find({ user: user._id, isActive: true }).select('completions');
  const habitsTotal = habits.length;
  const habitsDone = habits.filter((h) => h.completions.some((c) => c.date === today)).length;
  return {
    date: today,
    habitsDone,
    habitsTotal,
    streak: user.currentStreak || 0,
    xp: user.xp || 0,
    companion: equippedId(user),
  };
}

export const getHall = async (req, res) => {
  try {
    const me = ensureCompanions(await User.findById(req.user._id));
    const friendIds = me.friends || [];
    const circle = [me._id, ...friendIds];
    const posts = await Achievement.find({ user: { $in: circle } })
      .sort({ createdAt: -1 })
      .limit(40)
      .populate('user', AUTHOR_SELECT);

    const mine = posts.find((p) => String(p.user?._id) === String(me._id) && p.date === todayStr());
    res.json({
      shop: shopPayload(me),
      snapshot: await todaySnapshot(me),
      postedToday: Boolean(mine),
      todayPost: mine ? shapePost(mine, me._id) : null,
      feed: posts.map((p) => shapePost(p, me._id)),
      friendCount: friendIds.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const shareWin = async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    if (text.length < 2) return res.status(400).json({ message: 'Write a short win first.' });
    if (text.length > 140) return res.status(400).json({ message: 'Keep it under 140 characters.' });

    const me = ensureCompanions(await User.findById(req.user._id));
    const snap = await todaySnapshot(me);
    const post = await Achievement.findOneAndUpdate(
      { user: me._id, date: snap.date },
      { ...snap, text },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    ).populate('user', AUTHOR_SELECT);

    res.status(201).json({ post: shapePost(post, me._id), postedToday: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reactWin = async (req, res) => {
  try {
    const kind = String(req.body.kind || '');
    if (!REACTIONS.has(kind)) return res.status(400).json({ message: 'Unknown cheer.' });

    const post = await Achievement.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Win not found' });

    const me = await User.findById(req.user._id).select('friends name');
    const authorId = String(post.user);
    const isFriend = (me.friends || []).some((id) => String(id) === authorId);
    if (authorId !== String(me._id) && !isFriend) {
      return res.status(403).json({ message: 'Only friends around this fire.' });
    }

    const existing = post.reactions.find((r) => String(r.user) === String(me._id));
    const same = existing && existing.kind === kind;
    post.reactions = post.reactions.filter((r) => String(r.user) !== String(me._id));
    if (!same) post.reactions.push({ user: me._id, kind });
    await post.save();
    await post.populate('user', AUTHOR_SELECT);

    if (!same && authorId !== String(me._id)) {
      await Notification.create({
        user: post.user._id,
        title: 'A cheer from the Hall',
        message: `${me.name} sent you a ${kind === 'keep' ? 'keep going' : kind === 'gotthis' ? 'you got this' : 'cheer'}.`,
        type: 'achievement',
        meta: { kind: 'hall-cheer', postId: post._id, fromId: me._id },
      });
    }

    res.json({ post: shapePost(post, me._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getShop = async (req, res) => {
  try {
    const me = ensureCompanions(await User.findById(req.user._id));
    res.json(shopPayload(me));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const buyCompanion = async (req, res) => {
  try {
    const item = findCompanion(req.body.id);
    if (!item) return res.status(404).json({ message: 'Companion not found' });

    const me = ensureCompanions(await User.findById(req.user._id));
    const owned = ownedList(me);
    if (owned.includes(item.id)) return res.status(400).json({ message: 'Already at your fire.' });
    if (item.cost > 0 && !weekUnlocked(me)) {
      return res.status(400).json({ message: 'Keep a 7-day streak to open the ember shop.' });
    }
    if ((me.coins || 0) < item.cost) return res.status(400).json({ message: 'Not enough coins.' });

    me.coins -= item.cost;
    me.companions = [...owned, item.id];
    me.equippedCompanion = item.id;
    await me.save();

    res.json({
      shop: shopPayload(me),
      user: { coins: me.coins, companions: me.companions, equippedCompanion: me.equippedCompanion },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const equipCompanion = async (req, res) => {
  try {
    const item = findCompanion(req.body.id);
    if (!item) return res.status(404).json({ message: 'Companion not found' });

    const me = ensureCompanions(await User.findById(req.user._id));
    if (!ownedList(me).includes(item.id)) {
      return res.status(400).json({ message: 'Unlock this companion first.' });
    }
    me.equippedCompanion = item.id;
    await me.save();
    res.json({
      shop: shopPayload(me),
      user: { equippedCompanion: me.equippedCompanion },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
