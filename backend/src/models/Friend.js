import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    friendId: { type: String, required: true, index: true }
  },
  { timestamps: true }
);
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

export const Friend = mongoose.model('Friend', friendSchema);


