import { Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { PageLoader } from '../components/ui/Spinner';
import { EMSLogo } from '../components/ui/Logo';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const { isDark, toggle } = useDarkMode();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen auth-bg dot-grid relative overflow-hidden flex items-center justify-center p-4">

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(10,15,35,0.97)', color: '#F1F5F9',
            border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)', fontSize: '14px',
          },
          duration: 3500,
        }}
      />

      {/* Day / Night toggle */}
      <button
        onClick={toggle}
        className="icon-tile absolute top-4 right-4 z-20 w-10 h-10 rounded-xl flex items-center justify-center"
        aria-label="Toggle theme"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Floating orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="orb-1 absolute rounded-full"
          style={{
            width: 700, height: 700,
            top: '-18%', left: '-12%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)',
            filter: 'blur(1px)',
          }}
        />
        <div
          className="orb-2 absolute rounded-full"
          style={{
            width: 600, height: 600,
            bottom: '-12%', right: '-8%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 65%)',
            filter: 'blur(1px)',
          }}
        />
        <div
          className="orb-3 absolute rounded-full"
          style={{
            width: 450, height: 450,
            top: '25%', right: '15%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 60%)',
            filter: 'blur(1px)',
          }}
        />
        {/* Extra subtle orb */}
        <div
          className="orb-1 absolute rounded-full"
          style={{
            width: 300, height: 300,
            bottom: '20%', left: '10%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 60%)',
            filter: 'blur(2px)',
            animationDelay: '-5s',
          }}
        />
      </div>

      {/* Decorative grid lines */}
      <div className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo with border ring */}
        <div className="flex flex-col items-center mb-7 sm:mb-8">
          <div
            className="logo-glow rounded-[20px] p-2 mb-4"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <EMSLogo size={56} />
          </div>
          <h1 className="text-3xl font-black g-text tracking-tight leading-none">EMS</h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-2 tracking-[0.2em] uppercase">
            Employee Management System
          </p>
        </div>

        {/* Glass form card */}
        <div className="auth-card w-full px-6 py-8 sm:px-9 sm:py-9">
          <Outlet />
        </div>

        <p className="text-center text-xs text-slate-700 mt-6 tracking-wide">
          © 2026 EMS · Secure &amp; Reliable
        </p>
      </div>
    </div>
  );
}
