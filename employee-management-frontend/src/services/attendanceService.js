import api from './api';

export const attendanceService = {
  today: () => api.get('/attendance/today'),
  clockIn: () => api.post('/attendance/clock-in'),
  clockOut: () => api.post('/attendance/clock-out'),
  startBreak: () => api.post('/attendance/break/start'),
  endBreak: () => api.post('/attendance/break/end'),
  settings: () => api.get('/attendance/settings'),
  updateSettings: (data) => api.put('/attendance/settings', data),
  list: (date, page = 1) => api.get('/attendance', { params: { ...(date ? { date } : {}), page } }),
};
