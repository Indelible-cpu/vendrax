import axios from 'axios';

const api = axios.create({
  baseURL: (() => {
    const url = (import.meta.env.VITE_API_URL as string) || '';
    if (url.endsWith('/api')) return url;
    if (url.endsWith('/')) return url + 'api';
    return url ? url + '/api' : '/api';
  })(),
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      // Clear local state and redirect
      localStorage.removeItem('auth-storage'); // In case persistence is added
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
