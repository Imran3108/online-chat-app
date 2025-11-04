import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../state/useAuth.jsx';
import { createApiClient, apiFriendsAddByAccountId } from '../api/client.jsx';

export default function AddFriendModal({ open, onClose, onAdded }) {
  const { token } = useAuth();
  const api = createApiClient(() => token);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  async function add() {
    try {
      setError('');
      await apiFriendsAddByAccountId(api, code.trim());
      setCode('');
      onAdded?.();
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to add');
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="glass w-[90%] max-w-md mx-auto mt-24 p-6"
          >
            <div className="text-lg font-semibold mb-4">Add Friend</div>
            <div className="space-y-2">
              <div className="text-xs text-white/60">Enter the Account ID shared by your friend (e.g., 7G2K9A)</div>
              <div className="flex gap-2">
                <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Account ID" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none" />
                <button onClick={add} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15">Add</button>
              </div>
              {error && <div className="text-xs text-red-400">{error}</div>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


