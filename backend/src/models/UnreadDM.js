import mongoose from 'mongoose';

const unreadDMSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    roomId: { type: String, required: true, index: true },
    count: { type: Number, default: 0 }
  },
  { timestamps: true }
);
unreadDMSchema.index({ userId: 1, roomId: 1 }, { unique: true });

export const UnreadDM = mongoose.model('UnreadDM', unreadDMSchema);


