import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import Dashboard from '../pages/dashboard/Dashboard';
import Departments from '../pages/departments/Departments';
import Employees from '../pages/employees/Employees';
import EmployeeDetail from '../pages/employees/EmployeeDetail';
import Attendance from '../pages/attendance/Attendance';
import Leaves from '../pages/leaves/Leaves';
import Overtime from '../pages/overtime/Overtime';
import Salary from '../pages/salary/Salary';
import Settings from '../pages/settings/Settings';
import Profile from '../pages/profile/Profile';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/departments', element: <Departments /> },
      { path: '/employees', element: <Employees /> },
      { path: '/employees/:id', element: <EmployeeDetail /> },
      { path: '/attendance', element: <Attendance /> },
      { path: '/leaves', element: <Leaves /> },
      { path: '/overtime', element: <Overtime /> },
      { path: '/salary', element: <Salary /> },
      { path: '/settings', element: <Settings /> },
      { path: '/profile', element: <Profile /> },
    ],
  },
  // Registration is disabled — accounts are created by Admin/HR only.
  { path: '/register', element: <Navigate to="/login" replace /> },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
