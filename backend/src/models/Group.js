import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: String, required: true, index: true },
    memberIds: { type: [String], index: true, default: [] }
  },
  { timestamps: true }
);

export const Group = mongoose.model('Group', groupSchema);


