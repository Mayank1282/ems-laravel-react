import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, LogOut, Bell, UserCircle, ChevronDown, CalendarDays } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useNotifications } from '../../contexts/NotificationContext';
import Avatar from '../ui/Avatar';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const { items: notifs } = useNotifications();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  // Close dropdowns on outside click.
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openLeave = () => {
    setNotifOpen(false);
    navigate('/leaves');
  };

  return (
    <header className="h-16 glass-navbar flex items-center justify-between px-4 md:px-6 flex-shrink-0 gap-4 relative z-40">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="icon-tile lg:hidden w-9 h-9 rounded-xl flex items-center justify-center" aria-label="Toggle menu">
          <Menu size={18} />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="icon-tile w-9 h-9 rounded-xl flex items-center justify-center" aria-label="Toggle theme">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((o) => !o); setMenuOpen(false); }}
            className="icon-tile w-9 h-9 rounded-xl flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>
          {notifs.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center"
              style={{ boxShadow: '0 0 8px rgba(124,58,237,0.7)' }}>
              {notifs.length > 9 ? '9+' : notifs.length}
            </span>
          )}

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden z-50 modal-panel">
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <span className="text-sm font-bold text-slate-100">Notifications</span>
                <span className="text-xs text-slate-500">{notifs.length} new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">No new notifications</div>
                ) : (
                  notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={openLeave}
                      className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-violet-500/5"
                      style={{ borderBottom: '1px solid var(--surface-border)' }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(124,58,237,0.13)' }}>
                        <CalendarDays size={14} className="text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{n.title}</p>
                        <p className="text-xs text-slate-500">{n.message}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{n.time}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--surface-border)' }} />

        {/* Profile dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen((o) => !o); setNotifOpen(false); }}
            className="icon-tile flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl"
          >
            <Avatar name={user?.name} src={user?.avatar_url} size="sm" />
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-xs font-semibold text-slate-200">{user?.name?.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-500 capitalize">{user?.role}</span>
            </div>
            <ChevronDown size={14} className="text-slate-500" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-50 modal-panel">
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <p className="text-sm font-bold text-slate-100 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm text-slate-300 hover:bg-violet-500/5 transition-colors"
              >
                <UserCircle size={16} className="text-slate-500" /> My Profile
              </button>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                style={{ borderTop: '1px solid var(--surface-border)' }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
