import express from 'express';
import { authenticateHttp } from '../middleware/auth.js';
import { Message } from '../models/Message.js';

export const messagesRouter = express.Router();

messagesRouter.use(authenticateHttp);

// GET /api/messages?roomId=global&limit=50
messagesRouter.get('/', async (req, res) => {
  const roomId = (req.query.roomId || 'global').toString();
  const limit = Math.min(parseInt(req.query.limit?.toString() || '50', 10), 200);
  const items = await Message.find({ roomId }).sort({ createdAt: -1 }).limit(limit);
  res.json(items.reverse().map(m => ({
    id: String(m._id),
    roomId: m.roomId,
    senderId: m.senderId,
    senderName: m.senderName,
    text: m.text,
    createdAt: m.createdAt
  })));
});


