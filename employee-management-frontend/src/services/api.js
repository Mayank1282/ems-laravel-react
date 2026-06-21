import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
// Root origin (without the /api suffix) — used for Sanctum's CSRF cookie endpoint.
const ROOT_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,        // send/receive the Sanctum cookies
  withXSRFToken: true,          // attach X-XSRF-TOKEN header (axios 1.x, cross-origin)
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

/**
 * Fetch the CSRF cookie from Laravel Sanctum.
 * Must be called before the first stateful POST (login/register/etc.)
 * so the XSRF-TOKEN cookie exists and axios can echo it back.
 */
let csrfReady = false;
export async function ensureCsrfCookie() {
  if (csrfReady) return;
  await axios.get(`${ROOT_URL}/sanctum/csrf-cookie`, { withCredentials: true });
  csrfReady = true;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // A 419 means the CSRF token expired — force a refresh next time.
    if (status === 419) csrfReady = false;
    if (status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
