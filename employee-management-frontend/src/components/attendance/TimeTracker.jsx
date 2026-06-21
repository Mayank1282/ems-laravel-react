import { useEffect, useRef, useState, useCallback } from 'react';
import { Clock, Coffee, Play, LogOut, Timer, Zap, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService } from '../../services/attendanceService';
import { useAttendance } from '../../contexts/AttendanceContext';
import { formatDuration } from '../../utils/helpers';
import Card from '../ui/Card';

/**
 * Live work-time tracker. Worked seconds tick locally between server syncs
 * so the clock feels real-time without hammering the API.
 */
export default function TimeTracker({ large = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0); // forces re-render each second
  const baseRef = useRef({ worked: 0, breakSecs: 0, status: 'off', at: Date.now() });
  const { setStatus } = useAttendance();

  const sync = useCallback((summary) => {
    baseRef.current = {
      worked: summary.worked_seconds,
      breakSecs: summary.break_seconds,
      status: summary.status,
      required: summary.required_seconds,
      at: Date.now(),
    };
    setData(summary);
    setStatus(summary.status); // keep sidebar / navbar status dots in sync
  }, [setStatus]);

  useEffect(() => {
    attendanceService.today()
      .then(({ data: res }) => sync(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sync]);

  // 1-second local ticker
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-28 flex items-center justify-center text-slate-500 text-sm">Loading tracker…</div>
      </Card>
    );
  }
  if (!data) return null;

  // Derive live values from last server sync + elapsed local seconds.
  const elapsed = Math.floor((Date.now() - baseRef.current.at) / 1000);
  const status = baseRef.current.status;
  const liveWorked = baseRef.current.worked + (status === 'working' ? elapsed : 0);
  const liveBreak = baseRef.current.breakSecs + (status === 'on_break' ? elapsed : 0);
  const required = baseRef.current.required || data.required_seconds;
  const official = Math.min(liveWorked, required);
  const overtime = Math.max(0, liveWorked - required);
  const pct = Math.min(100, Math.round((official / required) * 100));

  const act = async (fn, label) => {
    setBusy(true);
    try {
      const { data: res } = await fn();
      sync(res.data);
      if (label) toast.success(label);
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  // Online only while actively working; break or checked-out = offline.
  const online = status === 'working';

  const statusMeta = {
    working:  { label: 'Checked In', color: '#10B981', bg: 'rgba(16,185,129,0.13)' },
    on_break: { label: 'On Break',   color: '#F59E0B', bg: 'rgba(245,158,11,0.13)' },
    off:      { label: 'Checked Out', color: '#64748B', bg: 'rgba(100,116,139,0.13)' },
  }[status];

  return (
    <Card className={large ? 'p-6 sm:p-10' : 'p-6'}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)' }}>
            <Timer size={17} className="text-violet-500 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Time Tracker</h2>
            <p className="text-xs text-slate-500">Today · {data.work_date}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.color}40` }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'working' ? 'pulse-active' : ''}`} style={{ background: statusMeta.color }} />
            {statusMeta.label}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: online ? '#10B981' : '#94A3B8' }}>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Big live clock */}
      <div className={`text-center ${large ? 'py-10' : 'py-4'}`}>
        <p className={`font-black text-slate-100 tracking-tight tabular-nums ${large ? 'text-6xl sm:text-8xl' : 'text-5xl'}`}>
          {formatDuration(liveWorked)}
        </p>
        <p className={`text-slate-500 ${large ? 'text-sm mt-4' : 'text-xs mt-2'}`}>Worked today</p>
      </div>

      {/* Progress to required hours */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-500">Progress to {Math.round(required / 3600)}h</span>
          <span className="font-semibold text-slate-300">{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: overtime > 0 ? 'linear-gradient(90deg,#F59E0B,#EF4444)' : 'linear-gradient(90deg,#7C3AED,#06B6D4)',
            }}
          />
        </div>
      </div>

      {/* Mini stats */}
      <div className={`grid grid-cols-3 gap-2 sm:gap-4 ${large ? 'mt-8' : 'mt-5'}`}>
        <Stat label="Official" value={formatDuration(official)} icon={Clock} color="#7C3AED" large={large} />
        <Stat label="Break" value={formatDuration(liveBreak)} icon={Coffee} color="#F59E0B" large={large} />
        <Stat label="Overtime" value={formatDuration(overtime)} icon={Zap} color={overtime > 0 ? '#EF4444' : '#64748B'} large={large} />
      </div>

      {/* Actions */}
      <div className={`flex gap-3 ${large ? 'mt-8' : 'mt-5'} ${large ? '[&_button]:py-3.5 [&_button]:text-base' : ''}`}>
        {status === 'working' && (
          <>
            <button onClick={() => act(attendanceService.startBreak, 'Break started')} disabled={busy}
              className="btn-glass flex-1 justify-center inline-flex items-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
              <Coffee size={15} /> Take a Break
            </button>
            <button onClick={() => act(attendanceService.clockOut, 'Checked out')} disabled={busy}
              className="btn-danger flex-1 justify-center inline-flex items-center gap-2 py-2.5 rounded-xl text-sm disabled:opacity-50">
              <LogOut size={15} /> Check Out
            </button>
          </>
        )}
        {status === 'on_break' && (
          <button onClick={() => act(attendanceService.endBreak, 'Welcome back!')} disabled={busy}
            className="btn-glow w-full justify-center inline-flex items-center gap-2 py-2.5 rounded-xl text-sm disabled:opacity-50">
            <Play size={15} /> Resume Work
          </button>
        )}
        {status === 'off' && (
          <button onClick={() => act(attendanceService.clockIn, 'Checked in')} disabled={busy}
            className="btn-glow w-full justify-center inline-flex items-center gap-2 py-2.5 rounded-xl text-sm disabled:opacity-50">
            <Play size={15} /> Check In
          </button>
        )}
      </div>
    </Card>
  );
}

function Stat({ label, value, icon: Icon, color, large = false }) {
  return (
    <div className={`surface rounded-xl text-center ${large ? 'p-5' : 'p-3'}`}>
      <Icon size={large ? 18 : 14} className="mx-auto mb-1" style={{ color }} />
      <p className={`font-bold text-slate-200 tabular-nums leading-tight ${large ? 'text-sm sm:text-base' : 'text-xs'}`}>{value}</p>
      <p className={`text-slate-500 mt-0.5 ${large ? 'text-xs' : 'text-[10px]'}`}>{label}</p>
    </div>
  );
}
