import api, { ensureCsrfCookie } from './api';

export const authService = {
  // These hit Sanctum's stateful API, so grab the CSRF cookie first.
  login: async (data) => {
    await ensureCsrfCookie();
    return api.post('/auth/login', data);
  },
  register: async (data) => {
    await ensureCsrfCookie();
    return api.post('/auth/register', data);
  },
  forgotPassword: async (data) => {
    await ensureCsrfCookie();
    return api.post('/auth/forgot-password', data);
  },
  resetPassword: async (data) => {
    await ensureCsrfCookie();
    return api.post('/auth/reset-password', data);
  },
  validateResetToken: (data) => api.post('/auth/validate-reset-token', data),

  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};
