import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', trim: true, maxlength: 240 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed'],
      default: 'pending',
    },
    coinReward: { type: Number, default: 12 },
    xpReward: { type: Number, default: 20 },
  },
  { timestamps: true }
);

challengeSchema.index({ to: 1, status: 1, createdAt: -1 });
challengeSchema.index({ from: 1, createdAt: -1 });

export default mongoose.model('Challenge', challengeSchema);
