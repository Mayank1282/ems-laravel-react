import { useEffect, useState, useCallback } from 'react';
import { Wallet, TrendingUp, FileText, Sparkles, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { salaryService } from '../../services/salaryService';
import { generatePayslip } from '../../utils/payslip';
import { confirmAction } from '../../utils/confirm';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import MonthPicker from '../../components/ui/MonthPicker';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function Salary() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'hr';
  return isStaff ? <StaffSalary /> : <EmployeeSalary />;
}

/* ───────────── Employee view: own payslips ───────────── */
function EmployeeSalary() {
  const [payrolls, setPayrolls] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    salaryService.payrolls(null, page)
      .then(({ data }) => { setPayrolls(data.data.data); setMeta(data.data.meta); })
      .catch(() => toast.error('Failed to load payslips.'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">My Salary</h1>
        <p className="text-sm text-slate-500 mt-1">Your monthly payslips</p>
      </div>
      <Card>
        {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          : payrolls.length === 0 ? <EmptyState icon={FileText} title="No payslips yet" description="Your payslips will appear here once HR generates them." />
          : <PayrollTable payrolls={payrolls} meta={meta} onPageChange={setPage} />}
      </Card>
    </div>
  );
}

/* ───────────── Staff view: manage salary & increments ───────────── */
function StaffSalary() {
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState([]);
  const [ovMeta, setOvMeta] = useState(null);
  const [ovPage, setOvPage] = useState(1);
  const [payrolls, setPayrolls] = useState([]);
  const [payMeta, setPayMeta] = useState(null);
  const [payPage, setPayPage] = useState(1);
  const [increments, setIncrements] = useState([]);
  const [incMeta, setIncMeta] = useState(null);
  const [incPage, setIncPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [incModal, setIncModal] = useState(null);   // { employee, mode: 'add'|'edit' }
  const [payModal, setPayModal] = useState(null);    // employee row

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: o }, { data: p }, { data: inc }] = await Promise.all([
        salaryService.overview(ovPage),
        salaryService.payrolls(null, payPage),
        salaryService.increments(null, incPage),
      ]);
      setOverview(o.data.data); setOvMeta(o.data.meta);
      setPayrolls(p.data.data); setPayMeta(p.data.meta);
      setIncrements(inc.data.data); setIncMeta(inc.data.meta);
    } catch {
      toast.error('Failed to load salary data.');
    } finally {
      setLoading(false);
    }
  }, [ovPage, payPage, incPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deletePayroll = async (id) => {
    const ok = await confirmAction({
      title: 'Delete payslip?',
      text: 'Payslips cannot be edited — you can delete and regenerate it afterwards.',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await salaryService.deletePayroll(id);
      toast.success('Payslip deleted.');
      fetchData();
    } catch {
      toast.error('Failed to delete payslip.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Salary &amp; Payroll</h1>
        <p className="text-sm text-slate-500 mt-1">Manage increments and generate monthly payslips</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[['overview', 'Employees'], ['payrolls', 'Payslips'], ['increments', 'Increments']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === key ? 'btn-glow' : 'btn-glass'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : tab === 'overview' ? (
        <Card>
          {overview.length === 0 ? <EmptyState icon={Wallet} title="No employees" description="Add employees to manage their salary." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    {['Employee', 'Salary', 'Hire Date', 'Anniversary', 'Status', ''].map((h) =>
                      <th key={h} className="text-left px-5 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {overview.map((e) => (
                    <tr key={e.id} className="trow" style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-200">{e.name}</p>
                        <p className="text-[11px] text-slate-600 font-mono">{e.employee_code}{e.role === 'hr' ? ' · HR' : ''}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-200">{formatCurrency(e.salary, e.salary_currency)}</td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(e.hire_date)}</td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(e.anniversary)}</td>
                      <td className="px-5 py-4">
                        {e.increment_due ? <Badge className="badge-pt">Increment Due</Badge>
                          : e.incremented ? <Badge className="badge-active">Incremented</Badge>
                          : <Badge className="badge-ct">On Track</Badge>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {!e.completed_year ? (
                            <span className="text-[11px] text-slate-600" title="Available after 1 year of service">&lt; 1 yr</span>
                          ) : !e.incremented ? (
                            <Button size="sm" variant="secondary" onClick={() => setIncModal({ employee: e, mode: 'add' })}><TrendingUp size={13} /> Increment</Button>
                          ) : !e.increment_edited ? (
                            <Button size="sm" variant="secondary" onClick={() => setIncModal({ employee: e, mode: 'edit' })}><TrendingUp size={13} /> Edit Increment</Button>
                          ) : (
                            <span className="text-[11px] text-emerald-500 dark:text-emerald-400" title="Incremented (edit used)">Done ✓</span>
                          )}
                          <Button size="sm" onClick={() => setPayModal(e)}><FileText size={13} /> Payslip</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ovMeta && (
                <div style={{ borderTop: '1px solid var(--surface-border)', padding: '0 8px' }}>
                  <Pagination meta={ovMeta} onPageChange={setOvPage} />
                </div>
              )}
            </div>
          )}
        </Card>
      ) : tab === 'payrolls' ? (
        <Card>
          {payrolls.length === 0 ? <EmptyState icon={FileText} title="No payslips" description="Generate payslips from the Employees tab." />
            : <PayrollTable payrolls={payrolls} meta={payMeta} onPageChange={setPayPage} onDelete={deletePayroll} showEmployee />}
        </Card>
      ) : (
        <Card>
          {increments.length === 0 ? <EmptyState icon={TrendingUp} title="No increments" description="Increment history will appear here." />
            : <IncrementsTable increments={increments} meta={incMeta} onPageChange={setIncPage} />}
        </Card>
      )}

      {incModal && <IncrementModal employee={incModal.employee} mode={incModal.mode} onClose={() => setIncModal(null)} onSaved={() => { setIncModal(null); fetchData(); }} />}
      {payModal && <PayrollModal employee={payModal} onClose={() => setPayModal(null)} onSaved={() => { setPayModal(null); fetchData(); }} />}
    </div>
  );
}

function PayrollTable({ payrolls, showEmployee, meta, onPageChange, onDelete }) {
  const monthLabel = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const payDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
            {[showEmployee ? 'Employee' : null, 'Month', 'Pay Date', 'Base', 'Arrears', 'Overtime', 'Deduction', 'Net Salary', '']
              .filter((h) => h !== null).map((h, i) => <th key={i} className="text-left px-5 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {payrolls.map((p) => (
            <tr key={p.id} className="trow" style={{ borderBottom: '1px solid var(--surface-border)' }}>
              {showEmployee && (
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-200">{p.employee?.first_name} {p.employee?.last_name}</p>
                  <p className="text-[11px] text-slate-600 font-mono">{p.employee?.employee_code}</p>
                </td>
              )}
              <td className="px-5 py-4 text-slate-300 font-medium">{monthLabel(p.period_month)}</td>
              <td className="px-5 py-4 text-slate-500">{payDate(p.pay_date)}</td>
              <td className="px-5 py-4 text-slate-400">{formatCurrency(p.base_salary, p.currency)}</td>
              <td className="px-5 py-4 text-emerald-500 dark:text-emerald-400">{p.arrears > 0 ? '+' + formatCurrency(p.arrears, p.currency) : '—'}</td>
              <td className="px-5 py-4 text-emerald-500 dark:text-emerald-400">{p.overtime > 0 ? '+' + formatCurrency(p.overtime, p.currency) : '—'}</td>
              <td className="px-5 py-4 text-red-500 dark:text-red-400">{p.leave_deduction > 0 ? '−' + formatCurrency(p.leave_deduction, p.currency) : '—'}</td>
              <td className="px-5 py-4 font-bold text-slate-100">{formatCurrency(p.net_salary, p.currency)}</td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button onClick={() => generatePayslip(p)} title="Download payslip"
                    className="icon-tile w-8 h-8 rounded-lg inline-flex items-center justify-center hover:!text-violet-400">
                    <Download size={14} />
                  </button>
                  {onDelete && (
                    <button onClick={() => onDelete(p.id)} title="Delete payslip"
                      className="icon-tile w-8 h-8 rounded-lg inline-flex items-center justify-center hover:!text-red-400">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {meta && (
        <div style={{ borderTop: '1px solid var(--surface-border)', padding: '0 8px' }}>
          <Pagination meta={meta} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}

function IncrementModal({ employee, mode = 'add', onClose, onSaved }) {
  const isEdit = mode === 'edit';
  // On edit, the displayed "current salary" is the pre-increment base; prefill old amount.
  const baseSalary = isEdit ? (Number(employee.salary) - Number(employee.increment_amount || 0)) : Number(employee.salary);
  const [amount, setAmount] = useState(isEdit ? String(employee.increment_amount ?? '') : '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = isEdit
        ? await salaryService.editIncrement({ employee_id: employee.id, amount: Number(amount) })
        : await salaryService.addIncrement({ employee_id: employee.id, amount: Number(amount), note });
      toast.success(data.message || 'Saved.');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save increment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`${isEdit ? 'Edit Increment' : 'Increment'} · ${employee.name}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="surface rounded-xl p-4 flex items-center gap-3">
          <Sparkles size={18} className="text-violet-400" />
          <div className="text-sm">
            <p className="text-slate-300">Base salary: <span className="font-bold text-slate-100">{formatCurrency(baseSalary, employee.salary_currency)}</span></p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit ? 'You can correct this increment only once.' : `Effective from anniversary: ${formatDate(employee.anniversary)} · arrears auto-calculated if delayed`}
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Increment Amount (monthly)</label>
          <input type="number" min="1" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10000" className="inp w-full" />
        </div>
        {amount > 0 && (
          <p className="text-xs text-slate-500">New salary will be <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{formatCurrency(baseSalary + Number(amount), employee.salary_currency)}</span></p>
        )}
        {!isEdit && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason / remarks" className="inp w-full" />
          </div>
        )}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancel</Button>
          <Button type="submit" loading={saving} className="flex-1 justify-center">{isEdit ? 'Update Increment' : 'Apply Increment'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function IncrementsTable({ increments, meta, onPageChange }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
            {['Employee', 'Effective', 'Previous', 'Increment', 'New Salary', 'Arrears', 'Processed'].map((h) =>
              <th key={h} className="text-left px-5 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {increments.map((inc) => (
            <tr key={inc.id} className="trow" style={{ borderBottom: '1px solid var(--surface-border)' }}>
              <td className="px-5 py-4">
                <p className="font-semibold text-slate-200">{inc.employee?.first_name} {inc.employee?.last_name}</p>
                <p className="text-[11px] text-slate-600 font-mono">{inc.employee?.employee_code}</p>
              </td>
              <td className="px-5 py-4 text-slate-400">{formatDate(inc.effective_date)}</td>
              <td className="px-5 py-4 text-slate-500">{formatCurrency(inc.previous_salary)}</td>
              <td className="px-5 py-4 text-emerald-500 dark:text-emerald-400">+{formatCurrency(inc.amount)}{inc.edited && <span className="text-[10px] text-slate-600 ml-1">(edited)</span>}</td>
              <td className="px-5 py-4 font-bold text-slate-100">{formatCurrency(inc.new_salary)}</td>
              <td className="px-5 py-4 text-slate-400">{inc.arrears_amount > 0 ? formatCurrency(inc.arrears_amount) : '—'}</td>
              <td className="px-5 py-4 text-slate-500">{formatDate(inc.processed_at)}<p className="text-[11px] text-slate-600">{inc.processor?.name}</p></td>
            </tr>
          ))}
        </tbody>
      </table>
      {meta && (
        <div style={{ borderTop: '1px solid var(--surface-border)', padding: '0 8px' }}>
          <Pagination meta={meta} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}

function PayrollModal({ employee, onClose, onSaved }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await salaryService.generatePayroll({ employee_id: employee.id, month });
      toast.success(`Payslip generated · Net ${formatCurrency(data.data.net_salary, data.data.currency)}`);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payslip.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Generate Payslip · ${employee.name}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="surface rounded-xl p-4 text-sm text-slate-400">
          Base salary <span className="font-bold text-slate-100">{formatCurrency(employee.salary, employee.salary_currency)}</span>. Net = base + unpaid increment arrears − paid-leave deduction.
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Salary Month</label>
          <MonthPicker value={month} onChange={setMonth} disabledMonths={employee.payslip_months || []} />
          <p className="text-[11px] text-slate-500">Months with an existing payslip are disabled — delete that payslip to regenerate.</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancel</Button>
          <Button type="submit" loading={saving} className="flex-1 justify-center">Generate</Button>
        </div>
      </form>
    </Modal>
  );
}
