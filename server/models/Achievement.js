import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: ['cheer', 'keep', 'gotthis'], required: true },
  },
  { _id: false },
);

const achievementSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 140 },
    habitsDone: { type: Number, default: 0 },
    habitsTotal: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    companion: { type: String, default: 'ember' },
    reactions: { type: [reactionSchema], default: [] },
  },
  { timestamps: true },
);

achievementSchema.index({ user: 1, date: 1 }, { unique: true });
achievementSchema.index({ createdAt: -1 });

export default mongoose.model('Achievement', achievementSchema);
