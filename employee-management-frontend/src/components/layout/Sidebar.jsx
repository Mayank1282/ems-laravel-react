import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, UserCircle, Clock, CalendarDays, Clock4, Wallet, Settings, X, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { EMSLogo } from '../ui/Logo';

// roles: omit = everyone; otherwise only listed roles see the item.
const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees', icon: Users, label: 'Employees', roles: ['admin', 'hr'] },
  { to: '/departments', icon: Building2, label: 'Departments', roles: ['admin'] },
  { to: '/attendance', icon: Clock, label: 'Attendance', roles: ['admin', 'hr'] },
  { to: '/leaves', icon: CalendarDays, label: 'Leaves' },
  { to: '/overtime', icon: Clock4, label: 'Overtime' },
  { to: '/salary', icon: Wallet, label: 'Salary' },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
  { to: '/profile', icon: UserCircle, label: 'My Profile' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const { online, tracked, status } = useAttendance();

  // Status colour: green when active, red when checked out, amber on break.
  const dot = !tracked ? '#10B981' : status === 'working' ? '#10B981' : status === 'on_break' ? '#F59E0B' : '#EF4444';
  const statusText = !tracked ? 'Active' : status === 'working' ? 'Active' : status === 'on_break' ? 'On Break' : 'Inactive';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col glass-sidebar
        transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo header */}
        <div className="flex items-center justify-between h-16 px-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
          <NavLink to="/dashboard" className="flex items-center gap-3 no-underline" onClick={onClose}>
            <div className="logo-glow">
              <EMSLogo size={36} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-100 tracking-tight leading-none">EMS</p>
              <p className="text-[10px] text-slate-600 leading-none mt-0.5">Management</p>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-300 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest px-3 mb-3">Navigation</p>

          {navItems
            .filter((item) => !item.roles || item.roles.includes(user?.role))
            .map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} className="nav-icon flex-shrink-0" />
                {label}
              </NavLink>
            ))}
        </nav>

        {/* Status badge — reflects the user's work status */}
        <div className="px-4 pb-3">
          <div className="rounded-xl px-3 py-2.5 flex items-center gap-2"
            style={{ background: `${dot}14`, border: `1px solid ${dot}26` }}>
            <span className={`flex-shrink-0 w-2 h-2 rounded-full ${online ? 'pulse-active' : ''}`} style={{ background: dot }} />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold" style={{ color: dot }}>{tracked ? statusText : 'System Online'}</p>
              <p className="text-[10px] text-slate-600 truncate">{tracked ? (online ? 'You are checked in' : 'You are checked out') : 'All services running'}</p>
            </div>
            <Zap size={13} className="flex-shrink-0 ml-auto" style={{ color: dot }} />
          </div>
        </div>

        {/* User info */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(124,58,237,0.08)' }}>
          <div className="flex items-center gap-3 p-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#4338CA)', boxShadow: '0 0 12px rgba(124,58,237,0.35)' }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{user?.name}</p>
              <p className="text-[11px] text-slate-600 capitalize mt-0.5">{user?.role}</p>
            </div>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} title={statusText} />
          </div>
        </div>
      </aside>
    </>
  );
}
