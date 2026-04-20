import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
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
