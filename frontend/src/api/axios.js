import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token jika ada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function clearAuthAndRedirect() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  const path = window.location.pathname;
  if (!path.includes('/admin/login') && !path.endsWith('/admin/login')) {
    window.location.href = '/admin/login';
  }
}

// Response interceptor — handle 401 (token kedaluwarsa / invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthAndRedirect();
    }
    return Promise.reject(error);
  }
);

export default api;
