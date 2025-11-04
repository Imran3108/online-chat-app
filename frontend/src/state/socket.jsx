import { io } from 'socket.io-client';
import { socketUrl } from '../api/client.jsx';

let socketSingleton = null;

export function getSocket(token) {
  if (!socketSingleton) {
    socketSingleton = io(socketUrl, { auth: { token } });
  }
  return socketSingleton;
}

export function closeSocket() {
  if (socketSingleton) {
    socketSingleton.close();
    socketSingleton = null;
  }
}


