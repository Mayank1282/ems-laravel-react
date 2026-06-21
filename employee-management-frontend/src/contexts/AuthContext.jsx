import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { attendanceService } from '../services/attendanceService';

// Attendance is only tracked for employees and HR — admins are not tracked.
const isTracked = (u) => u && (u.role === 'employee' || u.role === 'hr');
const safeClockIn = (u) => { if (isTracked(u)) attendanceService.clockIn().catch(() => {}); };
const safeClockOut = (u) => { if (isTracked(u)) return attendanceService.clockOut().catch(() => {}); };

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      authService.me()
        .then(({ data }) => { setUser(data.data); safeClockIn(data.data); })
        .catch(() => { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const { data } = await authService.login(credentials);
    localStorage.setItem('auth_token', data.data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    safeClockIn(data.data.user); // start/resume the work timer (employees & HR only)
    return data.data.user;
  };

  const register = async (credentials) => {
    const { data } = await authService.register(credentials);
    localStorage.setItem('auth_token', data.data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    try { await safeClockOut(user); } catch {}   // pause the work timer on logout (employees & HR only)
    try { await authService.logout(); } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('auth_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
