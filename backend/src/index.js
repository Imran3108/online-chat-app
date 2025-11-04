import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { authRouter } from './routes/auth.js';
import { messagesRouter } from './routes/messages.js';
import { groupsRouter } from './routes/groups.js';
import { friendsRouter } from './routes/friends.js';
import { unreadRouter } from './routes/unread.js';
import { authenticateSocket } from './middleware/auth.js';
import { Message } from './models/Message.js';
import { UnreadDM } from './models/UnreadDM.js';
import { utilsRouter } from './routes/utils.js';

const app = express();
const server = http.createServer(app);

const corsOrigin = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || ['*'];

const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/utils', utilsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/friends', (req, res, next) => {
  req.io = io; // Pass io instance to the request
  friendsRouter(req, res, next);
});
app.use('/api/unread', unreadRouter);

// Mongo
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

mongoose.set('strictQuery', true);
mongoose
  .connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Socket.IO
io.use(authenticateSocket);

const onlineUsers = new Map(); // userId -> count

io.on('connection', (socket) => {
  const user = socket.user;
  socket.join(user.id); // personal room for notifications (not chat messages)
  const count = (onlineUsers.get(user.id) || 0) + 1;
  onlineUsers.set(user.id, count);
  io.emit('presence', { userId: user.id, online: true });

  socket.on('joinRoom', (roomId) => {
    if (typeof roomId === 'string' && roomId.length > 0) {
      socket.join(roomId);
      socket.emit('joinedRoom', roomId);
      // If DM room and this user is a participant, reset unread count
      if (roomId.startsWith('dm:')) {
        const [, u1, u2] = roomId.split(':');
        if (u1 === user.id || u2 === user.id) {
          UnreadDM.findOneAndUpdate({ userId: user.id, roomId }, { $set: { count: 0 } }, { upsert: true }).then((doc) => {
            io.to(user.id).emit('dm_unread', { roomId, count: 0 });
          }).catch(() => {});
        }
      }
    }
  });

  socket.on('leaveRoom', (roomId) => {
    if (typeof roomId === 'string' && roomId.length > 0) {
      socket.leave(roomId);
    }
  });

  socket.on('typing', ({ roomId, isTyping }) => {
    if (roomId) {
      socket.to(roomId).emit('typing', { userId: user.id, isTyping: !!isTyping });
    }
  });

  socket.on('message', async ({ roomId, text }) => {
    if (!text || typeof text !== 'string') return;
    let safeRoomId = roomId || 'global';
    // Normalize DM room ids to canonical order: dm:<lowId>:<highId>
    if (typeof safeRoomId === 'string' && safeRoomId.startsWith('dm:')) {
      const parts = safeRoomId.split(':');
      const a = parts[1];
      const b = parts[2];
      if (a && b) {
        const [low, high] = a < b ? [a, b] : [b, a];
        safeRoomId = `dm:${low}:${high}`;
      }
    }
    const msg = await Message.create({ roomId: safeRoomId, senderId: user.id, senderName: user.name, text });
    const payload = {
      id: String(msg._id),
      roomId: msg.roomId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      text: msg.text,
      createdAt: msg.createdAt
    };
    // Emit only to the target room (same as global chat behavior)
    io.to(safeRoomId).emit('message', payload);
    // If DM, increment unread count for the other participant and notify via personal room
    if (safeRoomId.startsWith('dm:')) {
      const [, u1, u2] = safeRoomId.split(':');
      const recipientId = user.id === u1 ? u2 : u1;
      if (recipientId) {
        await UnreadDM.findOneAndUpdate(
          { userId: recipientId, roomId: safeRoomId },
          { $inc: { count: 1 } },
          { upsert: true, new: true }
        );
        io.to(recipientId).emit('dm_unread', { roomId: safeRoomId, count: undefined });
      }
    }
  });

  socket.on('disconnect', () => {
    const current = (onlineUsers.get(user.id) || 1) - 1;
    if (current <= 0) {
      onlineUsers.delete(user.id);
      io.emit('presence', { userId: user.id, online: false });
    } else {
      onlineUsers.set(user.id, current);
    }
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


