import jwt from 'jsonwebtoken';

export function authenticateHttp(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, name: payload.name, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Unauthorized'));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: payload.sub, name: payload.name, email: payload.email };
    next();
  } catch (e) {
    next(new Error('Unauthorized'));
  }
}


