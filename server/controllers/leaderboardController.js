import User from '../models/User.js';
import { mapRelations, sendFriendRequest, withRelation } from '../utils/friendship.js';

export const getGlobalLeaderboard = async (req, res) => {
  try {
    const { sort = 'xp' } = req.query;
    const sortField = sort === 'streak' ? { currentStreak: -1 } : { xp: -1 };

    const users = await User.find({ isActive: true })
      .select('name avatar xp level currentStreak longestStreak badges coins')
      .sort(sortField)
      .limit(50);

    const relations = await mapRelations(
      req.user._id,
      users.map((u) => u._id)
    );
    res.json(
      users.map((u, i) =>
        withRelation(
          {
            rank: i + 1,
            id: u._id,
            name: u.name,
            avatar: u.avatar,
            xp: u.xp,
            level: u.level,
            currentStreak: u.currentStreak,
            longestStreak: u.longestStreak,
            coins: u.coins,
            badgeCount: u.badges?.length || 0,
          },
          relations,
          req.user._id
        )
      )
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFriendsLeaderboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const friendIds = [...(user.friends || []), user._id];
    const { sort = 'xp' } = req.query;
    const sortField = sort === 'streak' ? { currentStreak: -1 } : { xp: -1 };

    const users = await User.find({ _id: { $in: friendIds }, isActive: true })
      .select('name avatar xp level currentStreak longestStreak badges coins')
      .sort(sortField);

    const relations = await mapRelations(
      req.user._id,
      users.map((u) => u._id)
    );
    res.json(
      users.map((u, i) =>
        withRelation(
          {
            rank: i + 1,
            id: u._id,
            name: u.name,
            avatar: u.avatar,
            xp: u.xp,
            level: u.level,
            currentStreak: u.currentStreak,
            longestStreak: u.longestStreak,
            coins: u.coins,
          },
          relations,
          req.user._id
        )
      )
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFriend = async (req, res) => {
  try {
    const userId = req.body?.userId;
    const email = String(req.body?.email || '').trim().toLowerCase();
    const friend = userId
      ? await User.findById(userId)
      : email
        ? await User.findOne({ email })
        : null;
    const result = await sendFriendRequest({
      fromId: req.user._id,
      fromName: req.user.name,
      toUser: friend,
    });
    res.status(result.accepted ? 200 : 201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};
