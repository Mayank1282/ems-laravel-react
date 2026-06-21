import api from './api';

export const departmentService = {
  list: (params) => api.get('/departments', { params }),
  all: () => api.get('/departments/all'),
  get: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};
