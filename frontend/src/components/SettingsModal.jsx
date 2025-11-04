import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../state/useAuth.jsx';
import { createApiClient, apiUpdateProfile } from '../api/client.jsx';

export default function SettingsModal({ open, onClose }) {
  const { user, theme, setTheme, token, setUser } = useAuth();
  const api = createApiClient(() => token);
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  useEffect(()=>{ setName(user?.name||''); setAvatarUrl(user?.avatarUrl||''); }, [user]);
  async function save() {
    const { data } = await apiUpdateProfile(api, { name, avatarUrl });
    setUser(data);
    onClose();
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
            <div className="text-lg font-semibold mb-4">Settings</div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-white/50 mb-1">Profile</div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-3">
                    <img src={avatarUrl || '/avatars/pfp.png'} alt="avatar" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                    <div className="flex-1">
                      <input className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none" value={name} onChange={e=>setName(e.target.value)} />
                      <div className="text-xs text-white/60">{user?.email}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/50 mb-1">Avatar URL</div>
                    <input className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none" placeholder="https://..." value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Account ID</div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 font-mono text-sm">{user?.accountId}</div>
                  <button onClick={()=>navigator.clipboard.writeText(user?.accountId||'')} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm">Copy</button>
                </div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Theme</div>
                <div className="flex gap-2">
                  <button onClick={() => setTheme('dark')} className={`px-3 py-2 rounded-lg border ${theme==='dark'?'bg-white/10 border-white/20':'border-white/10 bg-white/5'}`}>Dark</button>
                  <button onClick={() => setTheme('light')} className={`px-3 py-2 rounded-lg border ${theme==='light'?'bg-white/10 border-white/20':'border-white/10 bg-white/5'}`}>Light</button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15">Close</button>
              <button onClick={save} className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/25">Save</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


