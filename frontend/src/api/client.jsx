import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function createApiClient(getToken) {
  const client = axios.create({ baseURL: apiBaseUrl });
  client.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return client;
}

export const socketUrl = import.meta.env.VITE_SOCKET_URL || apiBaseUrl;

// Convenience API wrappers
export function apiMe(client) { return client.get('/api/auth/me'); }
export function apiGroupsList(client) { return client.get('/api/groups'); }
export function apiGroupsCreate(client, name, memberIds) { return client.post('/api/groups', { name, memberIds }); }
export function apiFriendsList(client) { return client.get('/api/friends'); }
export function apiFriendsAdd(client, email) { return client.post('/api/friends', { email }); }
export function apiFriendsAddByAccountId(client, accountId) { return client.post('/api/friends', { accountId }); }
export function apiUpdateProfile(client, { name, avatarUrl }) { return client.put('/api/auth/me', { name, avatarUrl }); }

export function apiUnreadDMList(client) { return client.get('/api/unread/dm'); }
export function apiGroupMembers(client, groupId) { return client.get(`/api/groups/${groupId}/members`); }
export function apiAddGroupMember(client, groupId, userId) { return client.post(`/api/groups/${groupId}/members`, { userId }); }
export function apiRemoveGroupMember(client, groupId, userId) { return client.delete(`/api/groups/${groupId}/members/${userId}`); }


