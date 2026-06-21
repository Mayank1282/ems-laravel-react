import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { attendanceService } from '../services/attendanceService';
import { setCurrency } from '../utils/currency';

const AttendanceContext = createContext(null);

const isTracked = (u) => u && (u.role === 'employee' || u.role === 'hr');

export function AttendanceProvider({ children }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('off'); // working | on_break | off

  const refresh = useCallback(() => {
    if (!isTracked(user)) return;
    attendanceService.today()
      .then(({ data }) => setStatus(data.data.status))
      .catch(() => {});
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Sync the company-wide currency for all authenticated users.
  useEffect(() => {
    if (!user) return;
    attendanceService.settings()
      .then(({ data }) => setCurrency(data.data.currency))
      .catch(() => {});
  }, [user]);

  // Admin isn't tracked → treat as always active. Tracked users are online only while working.
  const online = isTracked(user) ? status === 'working' : true;

  return (
    <AttendanceContext.Provider value={{ status, setStatus, refresh, online, tracked: isTracked(user) }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export const useAttendance = () => useContext(AttendanceContext);
