import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Message = mongoose.model('Message', messageSchema);


