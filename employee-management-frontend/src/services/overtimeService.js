import api from './api';

export const overtimeService = {
  list: (page = 1) => api.get('/overtime', { params: { page } }),
  create: (data) => api.post('/overtime', data),
  update: (id, status) => api.put(`/overtime/${id}`, { status }),
  remove: (id) => api.delete(`/overtime/${id}`),
};
