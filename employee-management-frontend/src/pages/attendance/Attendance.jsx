import { useEffect, useState, useCallback } from 'react';
import { Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService } from '../../services/attendanceService';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import DatePicker from '../../components/ui/DatePicker';
import { formatDuration } from '../../utils/helpers';

const statusBadge = {
  working: 'badge-active',
  on_break: 'badge-pt',
  off: 'badge-inactive',
};
const statusLabel = { working: 'Checked In', on_break: 'On Break', off: 'Checked Out' };

export default function Attendance() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await attendanceService.list(date, page);
      setRecords(data.data.records);
      setMeta(data.data.meta);
    } catch {
      toast.error('Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }, [date, page]);

  useEffect(() => { setPage(1); }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">Daily attendance log of all employees</p>
      </div>

      {/* Daily attendance */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5" style={{ borderBottom: '1px solid var(--surface-border)' }}>
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-violet-500 dark:text-violet-400" />
            <h2 className="text-base font-bold text-slate-100">Daily Log</h2>
          </div>
          <div className="w-full sm:w-52">
            <DatePicker value={date} max={today} onChange={(v) => setDate(v)} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : records.length === 0 ? (
          <EmptyState icon={Users} title="No attendance records" description="No employees have clocked in on this date." />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    {['Employee', 'Status', 'Check In', 'Worked', 'Break', 'Overtime'].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="trow" style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.user?.name} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-200">{r.user?.name}</p>
                            <p className="text-[11px] text-slate-600">{r.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge[r.status]}`}>
                          {statusLabel[r.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {r.first_clock_in_at ? new Date(r.first_clock_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-200 tabular-nums">{formatDuration(r.worked_seconds)}</td>
                      <td className="px-5 py-4 text-slate-500 tabular-nums">{formatDuration(r.break_seconds)}</td>
                      <td className="px-5 py-4 tabular-nums" style={{ color: r.overtime_seconds > 0 ? '#EF4444' : 'var(--text)' }}>
                        {formatDuration(r.overtime_seconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden">
              {records.map((r) => (
                <div key={r.id} className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.user?.name} size="sm" />
                      <p className="font-semibold text-slate-200 text-sm">{r.user?.name}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge[r.status]}`}>
                      {statusLabel[r.status]}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-[10px] text-slate-600">Worked</p><p className="text-xs font-bold text-slate-200 tabular-nums">{formatDuration(r.worked_seconds)}</p></div>
                    <div><p className="text-[10px] text-slate-600">Break</p><p className="text-xs font-bold text-slate-400 tabular-nums">{formatDuration(r.break_seconds)}</p></div>
                    <div><p className="text-[10px] text-slate-600">Overtime</p><p className="text-xs font-bold tabular-nums" style={{ color: r.overtime_seconds > 0 ? '#EF4444' : 'inherit' }}>{formatDuration(r.overtime_seconds)}</p></div>
                  </div>
                </div>
              ))}
            </div>
            {meta && (
              <div style={{ borderTop: '1px solid var(--surface-border)', padding: '0 8px' }}>
                <Pagination meta={meta} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
