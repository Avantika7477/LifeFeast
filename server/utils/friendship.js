import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function mapRelations(meId, userIds) {
  const ids = userIds.filter(Boolean);
  const out = {};
  for (const id of ids) {
    const sid = String(id);
    out[sid] = String(id) === String(meId) ? { relation: 'me' } : { relation: 'none' };
  }
  if (!ids.length) return out;

  const me = await User.findById(meId).select('friends');
  const friendSet = new Set((me?.friends || []).map((id) => String(id)));
  for (const id of ids) {
    const sid = String(id);
    if (sid === String(meId)) continue;
    if (friendSet.has(sid)) out[sid] = { relation: 'friends' };
  }

  const pending = await FriendRequest.find({
    status: 'pending',
    $or: [
      { from: meId, to: { $in: ids } },
      { to: meId, from: { $in: ids } },
    ],
  }).lean();

  for (const request of pending) {
    const from = String(request.from);
    const to = String(request.to);
    if (from === String(meId)) {
      out[to] = { relation: 'outgoing', requestId: String(request._id) };
    } else {
      out[from] = { relation: 'incoming', requestId: String(request._id) };
    }
  }
  return out;
}

export function withRelation(user, relations, meId) {
  const id = String(user._id || user.id);
  const rel = relations[id] || { relation: 'none' };
  return {
    ...user,
    id,
    relation: rel.relation,
    requestId: rel.requestId || null,
    isMe: rel.relation === 'me' || id === String(meId),
  };
}

export async function becomeFriends(aId, bId) {
  await User.updateOne({ _id: aId }, { $addToSet: { friends: bId } });
  await User.updateOne({ _id: bId }, { $addToSet: { friends: aId } });
}

export async function endFriendship(aId, bId) {
  await User.updateOne({ _id: aId }, { $pull: { friends: bId } });
  await User.updateOne({ _id: bId }, { $pull: { friends: aId } });
}

export async function sendFriendRequest({ fromId, fromName, toUser }) {
  if (!toUser || !toUser.isActive) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  if (toUser._id.equals(fromId)) {
    const err = new Error('You cannot add yourself');
    err.status = 400;
    throw err;
  }

  const me = await User.findById(fromId).select('friends name');
  if (me.friends.some((id) => id.equals(toUser._id))) {
    const err = new Error('Already friends');
    err.status = 400;
    throw err;
  }

  const incoming = await FriendRequest.findOne({
    from: toUser._id,
    to: fromId,
    status: 'pending',
  });
  if (incoming) {
    incoming.status = 'accepted';
    await incoming.save();
    await becomeFriends(fromId, toUser._id);
    await Notification.create({
      user: toUser._id,
      title: 'Friend request accepted',
      message: `${fromName || me.name} accepted. You can talk on Campfire.`,
      type: 'system',
      meta: { kind: 'friend-accepted', friendId: fromId, requestId: incoming._id },
    });
    return { message: `You and ${toUser.name} are now friends`, request: incoming, accepted: true };
  }

  const outgoing = await FriendRequest.findOne({
    from: fromId,
    to: toUser._id,
    status: 'pending',
  });
  if (outgoing) {
    const err = new Error('Request already sent');
    err.status = 400;
    throw err;
  }

  const request = await FriendRequest.create({ from: fromId, to: toUser._id });
  await Notification.create({
    user: toUser._id,
    title: 'Friend request',
    message: `${fromName || me.name} wants to be friends.`,
    type: 'system',
    meta: { kind: 'friend-request', friendId: fromId, requestId: request._id },
  });
  return { message: `Request sent to ${toUser.name}`, request, accepted: false };
}
