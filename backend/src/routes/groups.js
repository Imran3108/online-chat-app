import express from 'express';
import { authenticateHttp } from '../middleware/auth.js';
import { Group } from '../models/Group.js';
import { User } from '../models/User.js';

export const groupsRouter = express.Router();
groupsRouter.use(authenticateHttp);

// GET my groups
groupsRouter.get('/', async (req, res) => {
  const userId = req.user.id;
  const groups = await Group.find({ $or: [{ ownerId: userId }, { memberIds: userId }] }).sort({ createdAt: -1 });
  res.json(groups.map(g => ({ id: String(g._id), name: g.name, isOwner: g.ownerId === userId })));
});

// POST create group { name, memberIds? }
groupsRouter.post('/', async (req, res) => {
  const userId = req.user.id;
  const { name, memberIds = [] } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const allMemberIds = [userId, ...memberIds.filter(id => id !== userId)];
  const g = await Group.create({ name, ownerId: userId, memberIds: allMemberIds });
  res.status(201).json({ id: String(g._id), name: g.name });
});

// POST join group { groupId }
groupsRouter.post('/join', async (req, res) => {
  const userId = req.user.id;
  const { groupId } = req.body || {};
  if (!groupId) return res.status(400).json({ error: 'Missing groupId' });
  await Group.updateOne({ _id: groupId }, { $addToSet: { memberIds: userId } });
  res.json({ ok: true });
});

// POST invite by accountId { groupId, accountId }
groupsRouter.post('/invite', async (req, res) => {
  const { groupId, accountId } = req.body || {};
  if (!groupId || !accountId) return res.status(400).json({ error: 'Missing groupId or accountId' });
  const target = await User.findOne({ accountId });
  if (!target) return res.status(404).json({ error: 'User not found' });
  await Group.updateOne({ _id: groupId }, { $addToSet: { memberIds: String(target._id) } });
  res.json({ ok: true });
});

// POST remove member { groupId, userId }
groupsRouter.post('/remove', async (req, res) => {
  const { groupId, userId } = req.body || {};
  if (!groupId || !userId) return res.status(400).json({ error: 'Missing groupId or userId' });
  await Group.updateOne({ _id: groupId }, { $pull: { memberIds: userId } });
  res.json({ ok: true });
});

// GET group members { groupId }
groupsRouter.get('/:groupId/members', async (req, res) => {
  const userId = req.user.id;
  const { groupId } = req.params;
  const group = await Group.findOne({ _id: groupId, memberIds: userId });
  if (!group) return res.status(403).json({ error: 'Not a member' });
  const members = await User.find({ _id: { $in: group.memberIds } }, { name: 1, email: 1 });
  res.json(members.map(m => ({ id: String(m._id), name: m.name, email: m.email })));
});

// POST add member { userId }
groupsRouter.post('/:groupId/members', async (req, res) => {
  const userId = req.user.id;
  const { groupId } = req.params;
  const { userId: targetUserId } = req.body || {};
  if (!targetUserId) return res.status(400).json({ error: 'Missing userId' });
  const group = await Group.findOne({ _id: groupId, ownerId: userId });
  if (!group) return res.status(403).json({ error: 'Not owner' });
  await Group.updateOne({ _id: groupId }, { $addToSet: { memberIds: targetUserId } });
  res.json({ ok: true });
});

// DELETE remove member { userId }
groupsRouter.delete('/:groupId/members/:userId', async (req, res) => {
  const userId = req.user.id;
  const { groupId, userId: targetUserId } = req.params;
  const group = await Group.findOne({ _id: groupId, ownerId: userId });
  if (!group) return res.status(403).json({ error: 'Not owner' });
  await Group.updateOne({ _id: groupId }, { $pull: { memberIds: targetUserId } });
  res.json({ ok: true });
});


