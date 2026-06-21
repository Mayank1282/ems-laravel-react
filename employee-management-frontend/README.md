# Employee Management System — Frontend

A modern, responsive React 19 SaaS application for managing employees and departments. Features a clean dashboard, full CRUD operations, role-based UI, light/dark mode, and mobile-first responsive design.

## Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **HTTP**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Deployment**: Vercel

## Features

- Login / Register / Forgot Password
- Role-based navigation (Admin sees all, Employee sees profile only)
- Dashboard with stat cards and bar charts
- Department list with search, pagination, CRUD modals
- Employee list with search, filters (department, status), CRUD
- Employee detail page
- Profile management with avatar upload
- Light / Dark mode (persisted to localStorage)
- Fully responsive — mobile, tablet, desktop
- Loading states, empty states, error handling

## Local Setup

**Prerequisites**: Node.js 18+

```bash
git clone https://github.com/your-username/employee-management-frontend.git
cd employee-management-frontend
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8000/api
npm run dev
```

App runs at `http://localhost:5173`

## Environment Variables

```env
VITE_API_URL=http://localhost:8000/api
```

## Project Structure

```
src/
├── components/
│   ├── layout/     # Sidebar, Navbar
│   └── ui/         # Button, Input, Modal, Badge, Card, Avatar, Pagination, ...
├── contexts/       # AuthContext
├── hooks/          # useDarkMode
├── layouts/        # AuthLayout, AppLayout
├── pages/
│   ├── auth/       # Login, Register, ForgotPassword
│   ├── dashboard/  # Dashboard with charts
│   ├── departments/# Departments, DepartmentModal
│   ├── employees/  # Employees, EmployeeModal, EmployeeDetail
│   └── profile/    # Profile with avatar upload
├── routes/         # React Router configuration
├── services/       # api.js, authService, employeeService, ...
└── utils/          # helpers
```

## Deployment (Vercel)

1. Push to GitHub repository `employee-management-frontend`
2. Import project in Vercel
3. Add environment variable: `VITE_API_URL=https://your-backend.railway.app/api`
4. Deploy

**Demo login**: admin@yopmail.com / password
