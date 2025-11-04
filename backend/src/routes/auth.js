import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authRouter = express.Router();

function generateAccountId() {
  const rnd = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36).slice(-2);
  return (rnd + ts).toUpperCase();
}

authRouter.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body || {};
    if (!email || !name || !password) return res.status(400).json({ error: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    let accountId;
    // ensure unique accountId
    for (let i = 0; i < 5; i++) {
      const candidate = generateAccountId();
      const exists = await User.findOne({ accountId: candidate });
      if (!exists) { accountId = candidate; break; }
    }
    if (!accountId) return res.status(500).json({ error: 'Could not generate accountId' });
    const user = await User.create({ email, name, passwordHash, accountId });
    const token = jwt.sign({ sub: String(user._id), email, name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: String(user._id), email, name, accountId, avatarUrl: user.avatarUrl || null } });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ sub: String(user._id), email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: String(user._id), email: user.email, name: user.name, accountId: user.accountId, avatarUrl: user.avatarUrl || null } });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

authRouter.get('/me', async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: String(user._id), email: user.email, name: user.name, accountId: user.accountId, avatarUrl: user.avatarUrl || null });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

authRouter.put('/me', async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const updates = {};
    if (typeof req.body?.name === 'string') updates.name = req.body.name;
    if (typeof req.body?.avatarUrl === 'string') updates.avatarUrl = req.body.avatarUrl;
    const user = await User.findByIdAndUpdate(payload.sub, updates, { new: true });
    res.json({ id: String(user._id), email: user.email, name: user.name, accountId: user.accountId, avatarUrl: user.avatarUrl || null });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});


