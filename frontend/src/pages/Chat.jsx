import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createApiClient } from '../api/client.jsx';
import { getSocket } from '../state/socket.jsx';
import { useAuth } from '../state/useAuth.jsx';
import GroupSettingsModal from '../components/GroupSettingsModal.jsx';

export default function Chat() {
  const { token, user, setToken, setUser } = useAuth();
  const api = useMemo(() => createApiClient(() => token), [token]);
  const [search] = useSearchParams();
  const initialRoom = search.get('room') || 'global';
  const [roomId, setRoomId] = useState(initialRoom);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUserIds, setTypingUserIds] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const prevRoomRef = useRef(null);
  const currentRoomRef = useRef(null);

  function normalizeRoom(r) {
    if (!r) return 'global';
    if (!r.startsWith('dm:')) return r;
    const parts = r.split(':');
    const a = String(user?.id || '');
    if (parts.length === 3) {
      // Format dm:<id1>:<id2> → sort ids canonically
      const id1 = parts[1];
      const id2 = parts[2];
      if (!id1 || !id2) return r;
      const [low, high] = id1 < id2 ? [id1, id2] : [id2, id1];
      return `dm:${low}:${high}`;
    }
    if (parts.length === 2) {
      // Legacy dm:<otherId> → combine with current user id
      const other = parts[1];
      if (!a || !other) return r;
      const [low, high] = a < other ? [a, other] : [other, a];
      return `dm:${low}:${high}`;
    }
    return r;
  }
  // Update roomId when URL search changes so clicks switch instantly without refresh
  useEffect(() => {
    const next = search.get('room') || 'global';
    setRoomId(next);
    setMessages([]);
  }, [search]);

  useEffect(() => {
    if (!token || !user) return;
    const effective = normalizeRoom(roomId);
    let cancelled = false;
    api.get('/api/messages', { params: { roomId: effective, limit: 50 } }).then(({ data }) => {
      if (!cancelled) setMessages(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [api, roomId, token, user]);

  useEffect(() => {
    if (!token || !user) return;
    const socket = getSocket(token);
    socketRef.current = socket;
    // ensure currentRoomRef reflects current room on first mount
    currentRoomRef.current = normalizeRoom(roomId);
    const handleMessage = (m) => {
      if (m.roomId === currentRoomRef.current) {
        setMessages((prev) => [...prev, m]);
      }
    };
    const handleTyping = ({ userId, isTyping }) => {
      setTypingUserIds((prev) => {
        const set = new Set(prev);
        if (isTyping) set.add(userId); else set.delete(userId);
        return Array.from(set);
      });
    };
    socket.on('message', handleMessage);
    socket.on('typing', handleTyping);
    return () => {
      socket.off('message', handleMessage);
      socket.off('typing', handleTyping);
    };
  }, [token, user]);

  useEffect(() => {
    if (!token || !user || !socketRef.current) return;
    const socket = socketRef.current;
    const nextEffective = normalizeRoom(roomId);
    const prevEffective = prevRoomRef.current;
    if (prevEffective && prevEffective !== nextEffective) {
      socket.emit('leaveRoom', prevEffective);
    }
    if (prevEffective !== nextEffective) {
      socket.emit('joinRoom', nextEffective);
      prevRoomRef.current = nextEffective;
      currentRoomRef.current = nextEffective;
    }
  }, [roomId, token, user]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function sendMessage() {
    const t = text.trim();
    if (!t) return;
    const effective = normalizeRoom(roomId);
    socketRef.current.emit('message', { roomId: effective, text: t });
    setText('');
    socketRef.current.emit('typing', { roomId: effective, isTyping: false });
  }

  function handleTyping(e) {
    const val = e.target.value;
    setText(val);
    const effective = normalizeRoom(roomId);
    socketRef.current.emit('typing', { roomId: effective, isTyping: val.length > 0 });
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  function getGroupId() {
    if (!roomId.startsWith('group:')) return null;
    return roomId.split(':')[1];
  }

  function getGroupName() {
    if (!roomId.startsWith('group:')) return '';
    return roomId.split(':')[1] || 'Group';
  }

  function getDMFriendInfo() {
    if (!roomId.startsWith('dm:')) return null;
    const parts = roomId.split(':');
    if (parts.length !== 3) return null;
    
    const otherUserId = parts[1] === String(user?.id) ? parts[2] : parts[1];
    return { id: otherUserId };
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-3 md:px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="text-lg">{roomIcon(roomId)}</div>
          {roomId.startsWith('dm:') ? (
            <DMHeader friendId={getDMFriendInfo()?.id} />
          ) : (
            <div className="font-semibold capitalize">{roomId === 'global' ? 'Global Chat' : getGroupName()}</div>
          )}
        </div>
        <div className="text-sm text-white/70 flex items-center gap-3">
          <span>{user?.name}</span>
          {roomId.startsWith('group:') && (
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15">
                ⚙️ Settings
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-2 w-48 glass rounded-lg shadow-lg z-10">
                  <button 
                    onClick={() => { setShowSettings(false); setShowGroupSettings(true); }}
                    className="w-full text-left px-4 py-2 hover:bg-white/5 rounded-t-lg"
                  >
                    Manage Members
                  </button>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full text-left px-4 py-2 hover:bg-white/5 rounded-b-lg"
                  >
                    Leave Group
                  </button>
                </div>
              )}
            </div>
          )}
          <button onClick={logout} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15">Logout</button>
        </div>
      </div>
      <div ref={listRef} className="flex-1 overflow-auto p-3 md:p-4 space-y-3">
        {messages.map((m) => {
          const isOwnMessage = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                <div className={`text-xs mb-1 ${isOwnMessage ? 'text-right text-blue-200' : 'text-white/50'}`}>
                  {m.senderName}
                </div>
                <div className={`px-4 py-2 rounded-2xl ${
                  isOwnMessage 
                    ? 'bg-blue-500 text-white rounded-br-sm' 
                    : 'bg-white/10 text-white rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/10 p-3 md:p-4">
        {typingUserIds.length > 0 && <div className="text-xs text-white/50 mb-2">Someone is typing...</div>}
        <div className="flex gap-2">
          <input value={text} onChange={handleTyping} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message" className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20" />
          <button onClick={sendMessage} className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15">Send</button>
        </div>
      </div>
      
      {showGroupSettings && (
        <GroupSettingsModal 
          open={showGroupSettings}
          onClose={() => setShowGroupSettings(false)}
          groupId={getGroupId()}
          groupName={getGroupName()}
        />
      )}
    </div>
  );
}

function roomIcon(roomId) {
  if (roomId === 'global') return '🌐';
  if (roomId.startsWith('group:')) return '👥';
  if (roomId.startsWith('dm:')) return '👤';
  return '💬';
}

function DMHeader({ friendId }) {
  const [friendInfo, setFriendInfo] = useState(null);
  const [onlineMap, setOnlineMap] = useState({});
  const { token } = useAuth();

  useEffect(() => {
    if (!friendId || !token) return;
    
    // Get friend info
    const api = createApiClient(() => token);
    api.get('/api/friends').then(({ data }) => {
      const friend = data.find(f => f.id === friendId);
      if (friend) {
        setFriendInfo(friend);
      }
    }).catch(() => {});

    // Set up presence listener
    const socket = getSocket(token);
    const onPresence = ({ userId, online }) => {
      setOnlineMap(prev => ({ ...prev, [userId]: online ? 'online' : 'offline' }));
    };
    
    socket.on('presence', onPresence);
    return () => socket.off('presence', onPresence);
  }, [friendId, token]);

  if (!friendInfo) {
    return <div className="font-semibold">Loading...</div>;
  }

  const status = onlineMap[friendId] || 'offline';
  const statusColor = status === 'online' ? 'bg-emerald-500' : status === 'idle' ? 'bg-amber-400' : 'bg-zinc-500';
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <img src={friendInfo.avatarUrl || '/avatars/pfp.png'} alt="avatar" className="w-8 h-8 rounded-full border border-white/10 object-cover" />
        <div className={`w-2.5 h-2.5 ${statusColor} rounded-full absolute -bottom-0.5 -right-0.5`} />
      </div>
      <div>
        <div className="font-semibold">{friendInfo.name || friendInfo.email}</div>
        <div className="text-xs text-white/50 capitalize">{status}</div>
      </div>
    </div>
  );
}


