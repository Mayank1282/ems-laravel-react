import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { AttendanceProvider } from './contexts/AttendanceContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { router } from './routes';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AttendanceProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </AttendanceProvider>
    </AuthProvider>
  </StrictMode>
);
