import axios from 'axios';

// In Vite dev, always use the /api proxy so we never hit macOS AirPlay on :5000
// or a stale tab talking to the wrong port.
const API_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function apiErrorMessage(error, fallback) {
  const fromApi = error.response?.data?.message;
  if (fromApi) return fromApi;
  if (!error.response) {
    return 'Cannot reach the LifeQuest API. Start the server and refresh.';
  }
  return fallback;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lq_token');
      localStorage.removeItem('lq_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
