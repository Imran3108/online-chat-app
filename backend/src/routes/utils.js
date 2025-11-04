import express from 'express';
import { User } from '../models/User.js';

export const utilsRouter = express.Router();

// Run once: assign accountId for users missing it. Protected by header token.
utilsRouter.post('/migrate-account-ids', async (req, res) => {
  const token = req.headers['x-migration-token'];
  if (!token || token !== process.env.MIGRATION_TOKEN) return res.status(401).json({ error: 'Unauthorized' });

  function generateAccountId() {
    const rnd = Math.random().toString(36).slice(2, 8);
    const ts = Date.now().toString(36).slice(-2);
    return (rnd + ts).toUpperCase();
  }

  const toMigrate = await User.find({ $or: [{ accountId: { $exists: false } }, { accountId: null }] });
  let updated = 0;
  for (const u of toMigrate) {
    for (let i = 0; i < 5; i++) {
      const candidate = generateAccountId();
      const exists = await User.findOne({ accountId: candidate });
      if (!exists) {
        u.accountId = candidate;
        await u.save();
        updated++;
        break;
      }
    }
  }
  res.json({ updated });
});


