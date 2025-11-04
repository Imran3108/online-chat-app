import express from 'express';
import { authenticateHttp } from '../middleware/auth.js';
import { Friend } from '../models/Friend.js';
import { User } from '../models/User.js';

export const friendsRouter = express.Router();
friendsRouter.use(authenticateHttp);

// GET my friends
friendsRouter.get('/', async (req, res) => {
  const userId = req.user.id;
  const edges = await Friend.find({ userId });
  const ids = edges.map(e => e.friendId);
  const users = await User.find({ _id: { $in: ids } });
  const idToUser = new Map(users.map(u => [String(u._id), u]));
  res.json(ids.map(id => ({ id, name: idToUser.get(id)?.name || 'Friend', email: idToUser.get(id)?.email, avatarUrl: idToUser.get(id)?.avatarUrl })));
});

// POST add friend by accountId { accountId }
friendsRouter.post('/', async (req, res) => {
  const userId = req.user.id;
  const { accountId } = req.body || {};
  if (!accountId) return res.status(400).json({ error: 'Missing accountId' });
  const friend = await User.findOne({ accountId });
  if (!friend) return res.status(404).json({ error: 'User not found' });
  if (String(friend._id) === userId) return res.status(400).json({ error: 'Cannot friend yourself' });
  
  // Create friendship both sides
  await Friend.updateOne({ userId, friendId: String(friend._id) }, { $setOnInsert: { userId, friendId: String(friend._id) } }, { upsert: true });
  await Friend.updateOne({ userId: String(friend._id), friendId: userId }, { $setOnInsert: { userId: String(friend._id), friendId: userId } }, { upsert: true });
  
  // Emit real-time friend updates to both users
  const io = req.io;
  const friendData = { id: String(friend._id), name: friend.name, email: friend.email, avatarUrl: friend.avatarUrl };
  const userData = await User.findById(userId);
  const userFriendData = { id: userId, name: userData.name, email: userData.email, avatarUrl: userData.avatarUrl };
  
  io.to(userId).emit('friend_add', friendData);
  io.to(String(friend._id)).emit('friend_add', userFriendData);
  
  res.status(201).json({ ok: true });
});


