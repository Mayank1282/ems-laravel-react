import api from './api';

export const salaryService = {
  overview: (page = 1) => api.get('/salary/overview', { params: { page } }),
  increments: (employeeId, page = 1) => api.get('/salary/increments', { params: { page, ...(employeeId ? { employee_id: employeeId } : {}) } }),
  addIncrement: (data) => api.post('/salary/increments', data),
  editIncrement: (data) => api.put('/salary/increments', data),
  payrolls: (employeeId, page = 1) => api.get('/salary/payrolls', { params: { page, ...(employeeId ? { employee_id: employeeId } : {}) } }),
  generatePayroll: (data) => api.post('/salary/payrolls', data),
  deletePayroll: (id) => api.delete(`/salary/payrolls/${id}`),
};
