import mongoose from 'mongoose';

const missionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    coinReward: { type: Number, default: 10 },
    xpReward: { type: Number, default: 15 },
    date: { type: String, required: true }, // YYYY-MM-DD
    completed: { type: Boolean, default: false },
    completedAt: Date,
  },
  { timestamps: true }
);

missionSchema.index({ user: 1, date: 1, title: 1 }, { unique: true });

export default mongoose.model('Mission', missionSchema);
