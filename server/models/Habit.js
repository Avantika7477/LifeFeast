import mongoose from 'mongoose';

const completionSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  completedAt: { type: Date, default: Date.now },
});

const habitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: [
        'Health',
        'Fitness',
        'Study',
        'Coding',
        'Finance',
        'Meditation',
        'Reading',
        'Business',
        'Personal',
      ],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },
    target: { type: Number, default: 1 }, // times per day
    reminderTime: { type: String, default: '' }, // HH:mm
    color: { type: String, default: '#C9A227' },
    icon: { type: String, default: '🎯' },
    completions: [completionSchema],
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalCompletions: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

habitSchema.methods.getXpReward = function () {
  const map = { Easy: 10, Medium: 20, Hard: 40 };
  return map[this.difficulty] || 10;
};

export default mongoose.model('Habit', habitSchema);
