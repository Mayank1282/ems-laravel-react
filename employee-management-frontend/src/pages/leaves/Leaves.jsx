import { useEffect, useState, useCallback } from 'react';
import { Plus, CalendarDays, Check, X as XIcon, Trash2, CalendarCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { leaveService } from '../../services/leaveService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import DatePicker from '../../components/ui/DatePicker';
import TimePicker from '../../components/ui/TimePicker';
import { formatDate } from '../../utils/helpers';
import { confirmAction } from '../../utils/confirm';

const statusBadge = { pending: 'badge-pt', approved: 'badge-active', rejected: 'badge-inactive' };

export default function Leaves() {
  const { user } = useAuth();
  const { refresh: refreshNotifs } = useNotifications();
  const isStaff = user?.role === 'admin' || user?.role === 'hr';

  const [leaves, setLeaves] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [balance, setBalance] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '', half_day: false, start_time: '', end_time: '' });
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: l }, balRes, bookedRes] = await Promise.all([
        leaveService.list(page),
        isStaff ? Promise.resolve(null) : leaveService.balance(),
        isStaff ? Promise.resolve(null) : leaveService.bookedDates(),
      ]);
      setLeaves(l.data.data);
      setMeta(l.data.meta);
      if (balRes) setBalance(balRes.data.data);
      if (bookedRes) setBookedDates(bookedRes.data.data || []);
    } catch {
      toast.error('Failed to load leaves.');
    } finally {
      setLoading(false);
    }
  }, [isStaff, page]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const apply = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = form.half_day
        ? { ...form, end_date: form.start_date }
        : { ...form, start_time: '', end_time: '' };
      const { data } = await leaveService.apply(payload);
      toast.success(data.message || 'Leave applied.');
      setModalOpen(false);
      setForm({ start_date: '', end_date: '', reason: '', half_day: false, start_time: '', end_time: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply.');
    } finally {
      setSaving(false);
    }
  };

  const review = async (id, status) => {
    try {
      await leaveService.review(id, status);
      toast.success(`Leave ${status}.`);
      fetchAll();
      refreshNotifs(); // pending leave is now actioned → clear its notification
    } catch {
      toast.error('Action failed.');
    }
  };

  const remove = async (id) => {
    const ok = await confirmAction({ title: 'Cancel leave request?', text: 'This leave request will be removed.', confirmText: 'Remove', danger: true });
    if (!ok) return;
    try {
      await leaveService.remove(id);
      toast.success('Removed.');
      fetchAll();
    } catch {
      toast.error('Failed to remove.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Leaves</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isStaff ? 'Review and manage employee leave requests' : 'Apply for and track your leaves'}
          </p>
        </div>
        {!isStaff && (
          <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Apply for Leave</Button>
        )}
      </div>

      {/* Balance cards (employee only) */}
      {!isStaff && balance && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BalanceCard
            label="Annual Quota"
            value={balance.annual_quota}
            sub={balance.carried_forward > 0 ? `${balance.base_quota} + ${balance.carried_forward} carried` : 'casual / year'}
          />
          <BalanceCard label="Used This Year" value={balance.casual_used_year} sub={`${balance.casual_left_year} left`} accent="#7C3AED" />
          <BalanceCard label="Comp-off" value={balance.comp_off_available ?? 0} sub="from overtime" accent="#06B6D4" />
          <BalanceCard label="Left This Month" value={balance.casual_left_month} sub="casual leaves" accent="#10B981" />
        </div>
      )}

      <div className="rounded-xl p-3 text-xs text-slate-500 surface">
        <strong className="text-slate-300">Policy:</strong> 12 casual leaves per year · max 2 casual per month · up to <span className="text-cyan-500 dark:text-cyan-400">6 unused leaves carry forward</span> to next year · extra days are <span className="text-amber-500 dark:text-amber-400">paid leave (salary-deducted)</span>.
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : leaves.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No leave records" description={isStaff ? 'No employees have requested leave yet.' : 'You have not applied for any leave.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  {(isStaff ? ['Employee', 'Dates', 'Days', 'Type', 'Reason', 'Status', ''] : ['Dates', 'Days', 'Casual', 'Paid', 'Reason', 'Status', ''])
                    .map((h) => <th key={h} className="text-left px-5 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {leaves.map((lv) => (
                  <tr key={lv.id} className="trow" style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    {isStaff && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={lv.user?.name} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-200">{lv.user?.name}</p>
                            <p className="text-[11px] text-slate-600 capitalize">{lv.user?.role}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                      {lv.half_day ? (
                        <div>
                          <p>{formatDate(lv.start_date)}</p>
                          <p className="text-[11px] text-amber-500 dark:text-amber-400">
                            Half day{lv.start_time ? ` · ${String(lv.start_time).slice(0, 5)}–${String(lv.end_time).slice(0, 5)}` : ''}
                          </p>
                        </div>
                      ) : (
                        <span>{formatDate(lv.start_date)} → {formatDate(lv.end_date)}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-200">{lv.days}</td>
                    {isStaff ? (
                      <td className="px-5 py-4 text-xs">
                        <span className="text-emerald-500 dark:text-emerald-400">{lv.casual_days} casual</span>
                        {lv.paid_days > 0 && <span className="text-amber-500 dark:text-amber-400"> · {lv.paid_days} paid</span>}
                      </td>
                    ) : (
                      <>
                        <td className="px-5 py-4 text-emerald-500 dark:text-emerald-400">{lv.casual_days}</td>
                        <td className="px-5 py-4 text-amber-500 dark:text-amber-400">{lv.paid_days}</td>
                      </>
                    )}
                    <td className="px-5 py-4 text-slate-500 max-w-[160px] truncate">{lv.reason || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadge[lv.status]}`}>{lv.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {isStaff && lv.status === 'pending' && (
                          <>
                            <button onClick={() => review(lv.id, 'approved')} title="Approve" className="icon-tile w-8 h-8 rounded-lg flex items-center justify-center hover:!text-emerald-400"><Check size={14} /></button>
                            <button onClick={() => review(lv.id, 'rejected')} title="Reject" className="icon-tile w-8 h-8 rounded-lg flex items-center justify-center hover:!text-red-400"><XIcon size={14} /></button>
                          </>
                        )}
                        {!isStaff && lv.status === 'pending' && (
                          <button onClick={() => remove(lv.id)} title="Cancel" className="icon-tile w-8 h-8 rounded-lg flex items-center justify-center hover:!text-red-400"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Apply for Leave">
        <form onSubmit={apply} className="space-y-4">
          {/* Duration type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</label>
            <div className="grid grid-cols-2 gap-3">
              {[['full', 'Full Day(s)'], ['half', 'Half Day']].map(([key, label]) => {
                const active = (key === 'half') === form.half_day;
                return (
                  <button type="button" key={key}
                    onClick={() => setForm((f) => ({ ...f, half_day: key === 'half' }))}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? 'btn-glow' : 'btn-glass'}`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{form.half_day ? 'Date' : 'Start Date'}</label>
              <DatePicker value={form.start_date} disabledDates={bookedDates}
                onChange={(v) => setForm((f) => ({ ...f, start_date: v }))} />
            </div>
            {!form.half_day && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Date</label>
                <DatePicker value={form.end_date} disabledDates={bookedDates} min={form.start_date}
                  onChange={(v) => setForm((f) => ({ ...f, end_date: v }))} />
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Already-booked dates are disabled. You can still span across them — those days are skipped and the rest become an add-on leave.</p>
          {form.half_day && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leave Timing</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <TimePicker value={form.start_time} onChange={(v) => setForm((f) => ({ ...f, start_time: v }))} />
                  <p className="text-[10px] text-slate-600 mt-1">From</p>
                </div>
                <div>
                  <TimePicker value={form.end_time} onChange={(v) => setForm((f) => ({ ...f, end_time: v }))} />
                  <p className="text-[10px] text-slate-600 mt-1">To</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Half day counts as 0.5 leave. Pick the hours you'll be away — you can still check in for the rest of the day.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description / Reason</label>
            <textarea rows={3} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Describe the reason for your leave…" className="inp w-full resize-none" />
          </div>
          {balance && (
            <div className="surface rounded-xl p-3 text-xs text-slate-500 flex items-center gap-2">
              <CalendarCheck size={14} className="text-violet-400" />
              You have <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{Math.min(balance.casual_left_month, balance.casual_left_year)}</span> casual day(s) left. Extra days will be paid (deducted).
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1 justify-center">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1 justify-center">Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function BalanceCard({ label, value, sub, accent = '#64748B' }) {
  return (
    <Card className="p-5 card-lift" style={{ borderLeft: `3px solid ${accent}` }}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-black text-slate-100 mt-2 leading-none">{value}</p>
      <p className="text-xs text-slate-600 mt-1">{sub}</p>
    </Card>
  );
}
