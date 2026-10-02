import Mission from '../models/Mission.js';
import User from '../models/User.js';
import { MISSION_TEMPLATES, todayStr } from '../utils/helpers.js';
import { checkAndUnlockBadges } from '../utils/gamification.js';

/** Ensure today's missions exist, return them */
export const getMissions = async (req, res) => {
  try {
    const today = todayStr();
    let missions = await Mission.find({ user: req.user._id, date: today });

    if (missions.length === 0) {
      // Pick 3 random missions for the day
      const shuffled = [...MISSION_TEMPLATES].sort(() => 0.5 - Math.random()).slice(0, 3);
      missions = await Mission.insertMany(
        shuffled.map((m) => ({ ...m, user: req.user._id, date: today }))
      );
    }

    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeMission = async (req, res) => {
  try {
    const mission = await Mission.findOne({ _id: req.params.id, user: req.user._id });
    if (!mission) return res.status(404).json({ message: 'Mission not found' });
    if (mission.completed) return res.status(400).json({ message: 'Already completed' });

    mission.completed = true;
    mission.completedAt = new Date();
    await mission.save();

    const user = await User.findById(req.user._id);
    user.coins += mission.coinReward;
    const leveledUp = user.addXp(mission.xpReward);
    await user.save();
    await checkAndUnlockBadges(user._id);

    res.json({
      mission,
      coinsGained: mission.coinReward,
      xpGained: mission.xpReward,
      leveledUp,
      user: {
        coins: user.coins,
        xp: user.xp,
        level: user.level,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
