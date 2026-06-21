import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const refresh = useCallback(() => {
    if (!user) return;
    notificationService.list()
      .then(({ data }) => setItems(data.data.items || []))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [user, refresh]);

  return (
    <NotificationContext.Provider value={{ items, count: items.length, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
