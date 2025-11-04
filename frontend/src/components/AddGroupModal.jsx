import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../state/useAuth.jsx';
import { createApiClient, apiGroupsCreate, apiFriendsList } from '../api/client.jsx';

export default function AddGroupModal({ open, onClose, onCreated, friends }) {
  const { token, user } = useAuth();
  const api = createApiClient(() => token);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [localFriends, setLocalFriends] = useState(friends || []);

  useEffect(() => {
    if (open && !friends) {
      apiFriendsList(api).then(res => setLocalFriends(res.data || [])).catch(() => {});
    } else if (friends) {
      setLocalFriends(friends);
    }
  }, [open, friends]);

  function toggleFriend(friendId) {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  }

  async function create() {
    try {
      setError('');
      const memberIds = [user.id, ...selectedFriends];
      await apiGroupsCreate(api, name.trim(), memberIds);
      setName('');
      setSelectedFriends([]);
      onCreated?.();
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create');
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
            <div className="text-lg font-semibold mb-4">Create Group</div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-white/60 mb-2">Name your new group</div>
                <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Group name" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none" />
              </div>
              
              <div>
                <div className="text-xs text-white/60 mb-2">Add friends to group</div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {localFriends.map(friend => (
                    <label key={friend.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friend.id)}
                        onChange={() => toggleFriend(friend.id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{friend.name || friend.email}</div>
                        <div className="text-xs text-white/50">{friend.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={create} disabled={!name.trim() || selectedFriends.length === 0} className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed">Create Group</button>
              </div>
              {error && <div className="text-xs text-red-400">{error}</div>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


