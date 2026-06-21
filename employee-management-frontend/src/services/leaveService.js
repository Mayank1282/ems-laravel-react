import api from './api';

export const leaveService = {
  list: (page = 1) => api.get('/leaves', { params: { page } }),
  balance: () => api.get('/leaves/balance'),
  bookedDates: () => api.get('/leaves/booked-dates'),
  apply: (data) => api.post('/leaves', data),
  review: (id, status) => api.put(`/leaves/${id}/review`, { status }),
  remove: (id) => api.delete(`/leaves/${id}`),
};
