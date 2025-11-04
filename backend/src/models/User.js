import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    accountId: { type: String, required: true, unique: true, index: true },
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);


