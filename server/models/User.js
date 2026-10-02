import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const badgeSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  icon: String,
  unlockedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    coins: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: '' },
    badges: [badgeSchema],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/** XP required to reach a given level (cumulative threshold) */
userSchema.methods.getXpForLevel = function (level) {
  return Math.floor(100 * Math.pow(level, 1.5));
};

userSchema.methods.addXp = function (amount) {
  this.xp += amount;
  let leveledUp = false;
  while (this.xp >= this.getXpForLevel(this.level + 1)) {
    this.level += 1;
    leveledUp = true;
    this.coins += 50; // level-up bonus
  }
  return leveledUp;
};

export default mongoose.model('User', userSchema);
