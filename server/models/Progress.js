import mongoose from 'mongoose';

/** Daily aggregate progress snapshot for analytics */
const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    habitsCompleted: { type: Number, default: 0 },
    habitsTotal: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    coinsEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('Progress', progressSchema);
