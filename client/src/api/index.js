import api from './client';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  deleteAccount: () => api.delete('/auth/account'),
  exportData: () => api.get('/auth/export'),
};

export const habitAPI = {
  getAll: () => api.get('/habits'),
  getOne: (id) => api.get(`/habits/${id}`),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  remove: (id) => api.delete(`/habits/${id}`),
  complete: (id) => api.post(`/habits/${id}/complete`),
};

export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  remove: (id) => api.delete(`/tasks/${id}`),
};

export const progressAPI = {
  dashboard: () => api.get('/progress/dashboard'),
  calendar: (year, month) => api.get('/progress/calendar', { params: { year, month } }),
  day: (date) => api.get(`/progress/calendar/${date}`),
  analytics: () => api.get('/progress/analytics'),
};

export const journalAPI = {
  getAll: () => api.get('/journal'),
  getByDate: (date) => api.get(`/journal/${date}`),
  upsert: (data) => api.post('/journal', data),
  remove: (id) => api.delete(`/journal/${id}`),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  vapidKey: () => api.get('/notifications/vapid-key'),
  subscribe: (subscription) => api.post('/notifications/subscribe', subscription),
  unsubscribe: (endpoint) => api.delete('/notifications/subscribe', { data: { endpoint } }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
  generateDaily: () => api.post('/notifications/generate-daily'),
};

export const socialAPI = {
  friends: () => api.get('/social/friends'),
  unfriend: (friendId) => api.delete(`/social/friends/${friendId}`),
  people: (q) => api.get('/social/people', { params: { q } }),
  requests: () => api.get('/social/requests'),
  requestFriend: (data) => api.post('/social/requests', data),
  respondFriend: (id, action) => api.post(`/social/requests/${id}/respond`, { action }),
  messages: (friendId) => api.get(`/social/messages/${friendId}`),
  sendMessage: (friendId, text) => api.post(`/social/messages/${friendId}`, { text }),
  challenges: () => api.get('/social/challenges'),
  sendChallenge: (data) => api.post('/social/challenges', data),
  respondChallenge: (id, action) => api.post(`/social/challenges/${id}/respond`, { action }),
  completeChallenge: (id) => api.post(`/social/challenges/${id}/complete`),
};

export const missionAPI = {
  getAll: () => api.get('/missions'),
  complete: (id) => api.post(`/missions/${id}/complete`),
};

export const leaderboardAPI = {
  global: (sort) => api.get('/leaderboard/global', { params: { sort } }),
  friends: (sort) => api.get('/leaderboard/friends', { params: { sort } }),
  addFriend: (email) => api.post('/leaderboard/friends', { email }),
};

export const adminAPI = {
  users: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  analytics: () => api.get('/admin/analytics'),
  badges: () => api.get('/admin/badges'),
  reports: () => api.get('/admin/reports'),
  feedback: (params) => api.get('/admin/feedback', { params }),
  feedbackUnread: () => api.get('/admin/feedback/unread-count'),
  feedbackSeen: () => api.put('/admin/feedback/seen'),
  revertFeedback: (id) => api.put(`/admin/feedback/${id}/revert`),
  restoreFeedback: (id) => api.put(`/admin/feedback/${id}/restore`),
};

export const feedbackAPI = {
  wall: () => api.get('/feedback'),
  mine: () => api.get('/feedback/mine'),
  create: (data) => api.post('/feedback', data),
  remove: (id) => api.delete(`/feedback/${id}`),
};
