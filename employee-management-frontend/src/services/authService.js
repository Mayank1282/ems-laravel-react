import api from './api';

// Pure token-based auth — no CSRF cookie needed (works across domains).
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  validateResetToken: (data) => api.post('/auth/validate-reset-token', data),

  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};
