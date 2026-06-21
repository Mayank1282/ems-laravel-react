# Employee Management System — Backend API

A production-ready Laravel 12 REST API for the Employee Management System, featuring role-based access control, file uploads, and comprehensive CRUD operations.

## Tech Stack

- **Framework**: Laravel 12
- **Language**: PHP 8.5
- **Database**: MySQL (TiDB Cloud in production)
- **Authentication**: Laravel Sanctum
- **Deployment**: Railway

## Features

- Token authentication via Laravel Sanctum
- Role-based access control (Admin / Employee)
- Department management (CRUD)
- Employee management with user account creation
- Avatar uploads to public storage
- Activity logging for audit trail
- Dashboard statistics and analytics
- Search, filtering, and pagination
- Standardized JSON API responses
- Form Request validation

## Architecture

```
app/
├── Http/
│   ├── Controllers/    # Auth, Department, Employee, Profile, Dashboard
│   ├── Middleware/     # AdminMiddleware
│   ├── Requests/       # Form Request validation
│   └── Resources/      # API Resource transformers
├── Models/             # User, Department, Employee, ActivityLog
├── Services/           # AuthService, DepartmentService, EmployeeService, ActivityLogService
└── Traits/             # ApiResponse
```

## API Response Format

```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": {}
}
```

## Local Setup

**Prerequisites**: PHP 8.4+, Composer, MySQL 8+

```bash
git clone https://github.com/your-username/employee-management-backend.git
cd employee-management-backend
composer install
cp .env.example .env
php artisan key:generate
# Edit .env with your DB credentials
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

API available at `http://localhost:8000`

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@yopmail.com | password |
| Employee | alice.johnson@company.com | password |

## Key API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /api/auth/login | Public |
| POST | /api/auth/register | Public |
| GET | /api/dashboard/stats | Auth |
| GET/POST | /api/departments | Admin |
| GET/POST | /api/employees | Admin |
| GET/PUT | /api/profile | Auth |
| POST | /api/profile/avatar | Auth |

## Environment Variables

See `.env.example` for all required variables. Key production variables:

```env
APP_URL=https://your-railway-url.railway.app
DB_HOST=           # TiDB Cloud host
DB_DATABASE=employee_management
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## Deployment (Railway)

1. Push to GitHub → connect Railway to repo
2. Set all environment variables from `.env.example`
3. Set DB variables to TiDB Cloud credentials
4. Railway auto-deploys on push to main
