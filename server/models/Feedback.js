import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: ['review', 'improve'], required: true },
    rating: { type: Number, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 80, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    reverted: { type: Boolean, default: false },
    revertedAt: Date,
    revertedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    seenByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

feedbackSchema.index({ kind: 1, reverted: 1, createdAt: -1 });
feedbackSchema.index({ user: 1, createdAt: -1 });
feedbackSchema.index({ seenByAdmin: 1, reverted: 1 });

export default mongoose.model('Feedback', feedbackSchema);
