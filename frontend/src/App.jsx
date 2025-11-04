import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './state/useAuth.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { createApiClient, apiGroupsList, apiFriendsList, apiUnreadDMList } from './api/client.jsx';
import { getSocket, closeSocket } from './state/socket.jsx';
import AddFriendModal from './components/AddFriendModal.jsx';
import AddGroupModal from './components/AddGroupModal.jsx';

export default function App() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme, token, user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const api = createApiClient(() => token);
  const [addOpen, setAddOpen] = useState(false);
  const [onlineMap, setOnlineMap] = useState({});
  const [unreadMap, setUnreadMap] = useState({}); // key: roomId -> count
  const [groupOpen, setGroupOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [g, f, u] = await Promise.all([apiGroupsList(api), apiFriendsList(api), apiUnreadDMList(api)]);
        if (!cancel) {
          setGroups(g.data || []);
          setFriends(f.data || []);
          const map = {};
          (u.data || []).forEach(it => { map[it.roomId] = it.count; });
          setUnreadMap(map);
        }
      } catch {}
    })();
    return () => { cancel = true; };
  }, [token]);

  // presence socket
  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);
    const onDMUnread = ({ roomId, count }) => {
      setUnreadMap(prev => ({ ...prev, [roomId]: count === undefined ? ((prev[roomId]||0)+1) : count }));
    };
    const onPresence = ({ userId, online }) => {
      setOnlineMap((prev) => ({ ...prev, [userId]: online ? 'online' : 'offline' }));
    };
    const onFriendAdd = (friend) => {
      setFriends((prev) => [...prev, friend]);
    };
    s.on('dm_unread', onDMUnread);
    s.on('presence', onPresence);
    s.on('friend_add', onFriendAdd);
    return () => { s.off('presence', onPresence); s.off('dm_unread', onDMUnread); s.off('friend_add', onFriendAdd); };
  }, [token]);
  return (
    <div className="h-full flex">
      <aside className="relative w-64 p-4 space-y-4 border-r border-white/10 hidden md:flex md:flex-col">
        <div className="glass p-4 flex items-center gap-3">
          <div className="text-2xl">💬</div>
          <div>
            <div className="font-semibold">Online Chat</div>
            <div className="text-xs text-white/60">Modern Glass UI</div>
          </div>
        </div>

        <nav className="space-y-1">
          <SectionTitle>Chats</SectionTitle>
          <SidebarLink to="/chat" label="Global" icon="🌐" />
          {groups.map(g => (
            <SidebarLink key={g.id} to={`/chat?room=group:${g.id}`} label={g.name} icon="👥" />
          ))}
          <div className="px-2 pt-1">
            <button onClick={()=>setGroupOpen(true)} className="w-full px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15">Create Group</button>
          </div>
        </nav>

        <nav className="space-y-1 flex-1 overflow-auto">
          <SectionTitle>Friends</SectionTitle>
          {friends.map(fr => (
            <FriendItem key={fr.id} name={fr.name || fr.email} avatarUrl={fr.avatarUrl} status={onlineMap[fr.id]} unread={unreadMap[dmRoom(user?.id, fr.id)]} onClick={() => navigate(dmLink(user?.id, fr.id))} />
          ))}
          <div className="px-2 pt-2">
            <button onClick={()=>setAddOpen(true)} className="w-full px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15">Add Friend</button>
          </div>
        </nav>

        <div className="mt-2 pt-2 border-t border-white/10" />
        <div className="sticky bottom-4 left-0 right-0 px-0">
          <div className="px-2">
          <button aria-label="Settings" title="Settings" onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15">
            <span>⚙️</span>
            <span className="text-sm">Settings</span>
          </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-2 md:p-6">
        <div className="glass p-2 md:p-4 h-full">
          <Outlet />
        </div>
      </main>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
      <AddFriendModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddGroupModal open={groupOpen} onClose={()=>setGroupOpen(false)} onCreated={async()=>{ const g=await apiGroupsList(api); setGroups(g.data||[]); }} friends={friends} />
    </div>
  );
}

function SectionTitle({ children }) {
  return <div className="uppercase text-xs tracking-widest text-white/50 px-2">{children}</div>;
}

function SidebarLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-white/5 ${isActive ? 'bg-white/10' : ''}`}
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

function dmLink(a, b) {
  const [low, high] = String(a) < String(b) ? [a, b] : [b, a];
  return `/chat?room=dm:${low}:${high}`;
}

function dmRoom(a, b) {
  const [low, high] = String(a) < String(b) ? [a, b] : [b, a];
  return `dm:${low}:${high}`;
}

function FriendItem({ name, avatarUrl, status, unread, onClick }) {
  const color = status === 'online' ? 'bg-emerald-500' : status === 'idle' ? 'bg-amber-400' : 'bg-zinc-500';
  return (
    <button onClick={onClick} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
      <div className="relative">
        <img src={avatarUrl || '/avatars/pfp.png'} alt="avatar" className="w-8 h-8 rounded-full border border-white/10 object-cover" />
        <div className={`w-2.5 h-2.5 ${color} rounded-full absolute -bottom-0.5 -right-0.5`} />
      </div>
      <div className="flex-1">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-white/50">{status}</div>
      </div>
      {unread > 0 && (
        <div className="ml-auto px-2 py-0.5 rounded-full text-xs bg-white/20">{unread}</div>
      )}
    </button>
  );
}


