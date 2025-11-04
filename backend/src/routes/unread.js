import express from 'express';
import { authenticateHttp } from '../middleware/auth.js';
import { UnreadDM } from '../models/UnreadDM.js';

export const unreadRouter = express.Router();
unreadRouter.use(authenticateHttp);

// GET unread counts for DMs
unreadRouter.get('/dm', async (req, res) => {
  const items = await UnreadDM.find({ userId: req.user.id });
  res.json(items.map(i => ({ roomId: i.roomId, count: i.count })));
});


