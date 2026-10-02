import User from '../models/User.js';

export const getGlobalLeaderboard = async (req, res) => {
  try {
    const { sort = 'xp' } = req.query;
    const sortField = sort === 'streak' ? { currentStreak: -1 } : { xp: -1 };

    const users = await User.find({ isActive: true })
      .select('name avatar xp level currentStreak longestStreak badges coins')
      .sort(sortField)
      .limit(50);

    res.json(
      users.map((u, i) => ({
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
      }))
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

    res.json(
      users.map((u, i) => ({
        rank: i + 1,
        id: u._id,
        name: u.name,
        avatar: u.avatar,
        xp: u.xp,
        level: u.level,
        currentStreak: u.currentStreak,
        longestStreak: u.longestStreak,
        coins: u.coins,
        isMe: u._id.toString() === req.user._id.toString(),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFriend = async (req, res) => {
  try {
    const { email } = req.body;
    const friend = await User.findOne({ email });
    if (!friend) return res.status(404).json({ message: 'User not found' });
    if (friend._id.equals(req.user._id)) {
      return res.status(400).json({ message: 'Cannot add yourself' });
    }

    const user = await User.findById(req.user._id);
    if (user.friends.some((f) => f.equals(friend._id))) {
      return res.status(400).json({ message: 'Already friends' });
    }
    user.friends.push(friend._id);
    friend.friends.push(user._id);
    await user.save();
    await friend.save();
    res.json({ message: `Added ${friend.name} as friend` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
