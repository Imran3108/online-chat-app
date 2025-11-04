import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../state/useAuth.jsx';
import { createApiClient, apiFriendsList, apiGroupMembers, apiAddGroupMember, apiRemoveGroupMember } from '../api/client.jsx';

export default function GroupSettingsModal({ open, onClose, groupId, groupName }) {
  const { token, user } = useAuth();
  const api = createApiClient(() => token);
  const [members, setMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && groupId) {
      loadData();
    }
  }, [open, groupId]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [membersRes, friendsRes] = await Promise.all([
        apiGroupMembers(api, groupId),
        apiFriendsList(api)
      ]);
      setMembers(membersRes.data || []);
      setFriends(friendsRes.data || []);
    } catch (e) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function addMember(friendId) {
    try {
      setError('');
      await apiAddGroupMember(api, groupId, friendId);
      loadData();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to add member');
    }
  }

  async function removeMember(memberId) {
    try {
      setError('');
      await apiRemoveGroupMember(api, groupId, memberId);
      loadData();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to remove member');
    }
  }

  const nonMembers = friends.filter(friend => 
    !members.some(member => member.id === friend.id)
  );

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
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">Group Settings</div>
              <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-white/50">Loading...</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-medium mb-2">Group: {groupName}</div>
                  <div className="text-xs text-white/60 mb-3">Current Members ({members.length})</div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                        <div className="w-8 h-8 rounded-full bg-white/10" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{member.name || member.email}</div>
                          <div className="text-xs text-white/50">{member.email}</div>
                        </div>
                        {member.id !== user?.id && (
                          <button 
                            onClick={() => removeMember(member.id)}
                            className="px-2 py-1 text-xs rounded bg-red-500/20 hover:bg-red-500/30 text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {nonMembers.length > 0 && (
                  <div>
                    <div className="text-xs text-white/60 mb-3">Add Friends</div>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {nonMembers.map(friend => (
                        <div key={friend.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                          <div className="w-8 h-8 rounded-full bg-white/10" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{friend.name || friend.email}</div>
                            <div className="text-xs text-white/50">{friend.email}</div>
                          </div>
                          <button 
                            onClick={() => addMember(friend.id)}
                            className="px-2 py-1 text-xs rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && <div className="text-xs text-red-400">{error}</div>}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}