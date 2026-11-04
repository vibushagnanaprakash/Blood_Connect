import axios from 'axios';

// Base URL comes from the environment so the same code works locally and on Vercel
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

// Attach the JWT token to every request when logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn any Axios error into a readable message
export const errMsg = (e) =>
  e.response?.data?.message || (e.request ? 'Cannot reach the server. Is the backend running?' : e.message) || 'Something went wrong';

export default api;
