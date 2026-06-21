import { useEffect, useState, useCallback } from 'react';
import { Plus, Clock4, Trash2, Wallet, CalendarPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { overtimeService } from '../../services/overtimeService';
import { employeeService } from '../../services/employeeService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { confirmAction } from '../../utils/confirm';

export default function Overtime() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'hr';

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await overtimeService.list(page);
      setRows(data.data.data);
      setMeta(data.data.meta);
    } catch {
      toast.error('Failed to load overtime.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (id) => {
    const ok = await confirmAction({ title: 'Remove overtime?', text: 'This overtime record will be deleted.', confirmText: 'Remove', danger: true });
    if (!ok) return;
    try { await overtimeService.remove(id); toast.success('Removed.'); fetch(); }
    catch { toast.error('Failed to remove.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Overtime</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isStaff ? 'Record & manage extra-hours compensation' : 'Your extra-hours & compensation'}
          </p>
        </div>
        {isStaff && <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Record Overtime</Button>}
      </div>

      <div className="rounded-xl p-3 text-xs text-slate-500 surface">
        <strong className="text-slate-300">Policy:</strong> Weekday overtime → paid by the hour.
        Weekend / extra-day work → <span className="text-emerald-500 dark:text-emerald-400">cash</span> or <span className="text-cyan-500 dark:text-cyan-400">comp-off leave</span>.
        {!isStaff && ' Managed by HR — you can view your records here.'}
      </div>

      <Card>
        {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          : rows.length === 0 ? <EmptyState icon={Clock4} title="No overtime records" description={isStaff ? 'Record overtime for an employee to get started.' : 'Your overtime entries will appear here.'} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    {(isStaff ? ['Employee', 'Date', 'Hours', 'Day', 'Compensation', 'Reward', ''] : ['Date', 'Hours', 'Day', 'Compensation', 'Reward'])
                      .map((h) => <th key={h} className="text-left px-5 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.id} className="trow" style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      {isStaff && (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={o.user?.name} size="sm" />
                            <p className="font-semibold text-slate-200">{o.user?.name}</p>
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-4 text-slate-400">{formatDate(o.work_date)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-200">{o.hours}h</td>
                      <td className="px-5 py-4">
                        <Badge className={o.is_weekend ? 'badge-ct' : 'badge-ft'}>{o.is_weekend ? 'Weekend' : 'Weekday'}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: o.compensation === 'cash' ? '#10B981' : '#06B6D4' }}>
                          {o.compensation === 'cash' ? <Wallet size={13} /> : <CalendarPlus size={13} />}
                          {o.compensation === 'cash' ? 'Cash' : 'Comp-off'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-200">
                        {o.compensation === 'cash' ? formatCurrency(o.amount, o.currency) : `${o.leave_days} day(s)`}
                      </td>
                      {isStaff && (
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => remove(o.id)} title="Remove"
                            className="icon-tile w-8 h-8 rounded-lg inline-flex items-center justify-center hover:!text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {meta && (
                <div style={{ borderTop: '1px solid var(--surface-border)', padding: '0 8px' }}>
                  <Pagination meta={meta} onPageChange={setPage} />
                </div>
              )}
            </div>
          )}
      </Card>

      {isStaff && modalOpen && (
        <OvertimeModal onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetch(); }} />
      )}
    </div>
  );
}

function OvertimeModal({ onClose, onSaved }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ user_id: '', work_date: '', hours: '', compensation: 'cash', note: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    employeeService.list({ per_page: 100 }).then(({ data }) => setEmployees(data.data.data)).catch(() => {});
  }, []);

  const isWeekend = form.work_date ? [0, 6].includes(new Date(form.work_date).getDay()) : false;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await overtimeService.create(form);
      toast.success(data.message || 'Overtime recorded.');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record overtime.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Record Overtime">
      <form onSubmit={submit} className="space-y-4">
        <Select label="Employee" value={form.user_id} onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}>
          <option value="">Select employee…</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.user?.id}>{emp.full_name} ({emp.employee_code})</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</label>
            <DatePicker value={form.work_date}
              onChange={(v) => setForm((f) => ({ ...f, work_date: v, compensation: [0, 6].includes(new Date(v + 'T00:00:00').getDay()) ? f.compensation : 'cash' }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hours</label>
            <input type="number" step="0.5" min="0.5" max="24" required value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} placeholder="e.g. 3" className="inp w-full" />
          </div>
        </div>
        {form.work_date && (
          <div className="surface rounded-xl p-3 text-xs text-slate-500">
            {isWeekend ? 'Weekend / extra day — cash or comp-off leave allowed.' : 'Weekday — cash only.'}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compensation</label>
          <div className="grid grid-cols-2 gap-3">
            {[['cash', 'Cash'], ['leave', 'Comp-off Leave']].map(([key, label]) => {
              const disabled = key === 'leave' && !isWeekend;
              const active = form.compensation === key;
              return (
                <button type="button" key={key} disabled={disabled}
                  onClick={() => setForm((f) => ({ ...f, compensation: key }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${active && !disabled ? 'btn-glow' : 'btn-glass'}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Note (optional)</label>
          <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Reason / project" className="inp w-full" />
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancel</Button>
          <Button type="submit" loading={saving} className="flex-1 justify-center">Record</Button>
        </div>
      </form>
    </Modal>
  );
}
