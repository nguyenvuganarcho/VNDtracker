import axios from 'axios';
import { getToken, removeToken } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only force logout when a request that carried a token got rejected
    // (expired/invalid session). A 401 from /auth/login or /auth/register
    // itself (wrong credentials) never carries a token and must be left
    // for the calling page to display as a normal form error.
    const hadAuthHeader = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && hadAuthHeader) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
