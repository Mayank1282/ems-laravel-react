import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import DatePicker from '../../components/ui/DatePicker';
import TimePicker from '../../components/ui/TimePicker';
import { COUNTRY_CODES, validatePhone } from '../../utils/currency';

const TODAY = new Date().toISOString().slice(0, 10);

const defaultForm = {
  first_name: '', last_name: '', email: '', password: '',
  department_id: '', phone: '', country_code: '', gender: '', date_of_birth: '',
  address: '', job_title: '', employment_type: 'full_time',
  shift_start_time: '', shift_end_time: '', shift_required_minutes: '',
  hire_date: '', salary: '', status: 'active', role: 'employee',
};

export default function EmployeeModal({ isOpen, onClose, onSave, employee, departments }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isEdit = !!employee;

  useEffect(() => {
    if (employee) {
      setForm({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        password: '',
        department_id: employee.department?.id || '',
        phone: employee.phone || '',
        country_code: employee.country_code || '',
        gender: employee.gender || '',
        date_of_birth: employee.date_of_birth || '',
        address: employee.address || '',
        job_title: employee.job_title || '',
        employment_type: employee.employment_type || 'full_time',
        shift_start_time: employee.shift_start_time || '',
        shift_end_time: employee.shift_end_time || '',
        shift_required_minutes: employee.shift_required_minutes || '',
        hire_date: employee.hire_date || '',
        salary: employee.salary || '',
        status: employee.status || 'active',
        role: employee.role || 'employee',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [employee, isOpen]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate phone against the selected country code.
    const phoneErr = validatePhone(form.country_code, form.phone);
    if (phoneErr) { setErrors((er) => ({ ...er, phone: [phoneErr] })); return; }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.department_id) delete payload.department_id;
      if (!payload.shift_start_time) delete payload.shift_start_time;
      if (!payload.shift_end_time) delete payload.shift_end_time;
      if (!payload.shift_required_minutes) delete payload.shift_required_minutes;
      if (!isAdmin) delete payload.role; // only admins can set HR role
      if (isEdit) {
        await employeeService.update(employee.id, payload);
        toast.success('Employee updated.');
      } else {
        await employeeService.create(payload);
        toast.success('Employee added.');
      }
      onSave();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else toast.error(data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const field = (name) => ({ name, value: form[name], onChange: handleChange, error: errors[name]?.[0] });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Employee' : 'Add Employee'} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Personal Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name *" placeholder="John" required {...field('first_name')} />
            <Input label="Last Name *" placeholder="Doe" required {...field('last_name')} />
            <Input label="Email *" type="email" placeholder="john@company.com" required {...field('email')} />
            {/* Password — only on create. On edit it can't be changed; use Forgot Password. */}
            {!isEdit && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Min 8 chars"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className={`inp w-full pr-11 ${errors.password ? 'err' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password[0]}</p>}
              </div>
            )}
            {/* Phone with country code */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</label>
              <div className="flex gap-2">
                <Select className="w-28 flex-shrink-0" value={form.country_code}
                  onChange={(e) => { setForm((f) => ({ ...f, country_code: e.target.value })); setErrors((er) => ({ ...er, phone: '' })); }}>
                  <option value="">Code</option>
                  {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.code} {c.iso}</option>)}
                </Select>
                <input className={`inp w-full ${errors.phone ? 'err' : ''}`} placeholder="555-0100" name="phone"
                  value={form.phone} onChange={(e) => { handleChange(e); setErrors((er) => ({ ...er, phone: '' })); }} />
              </div>
              {errors.phone && <p className="text-xs text-red-400">{errors.phone[0]}</p>}
            </div>
            <Select label="Gender" {...field('gender')}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date of Birth</label>
              <DatePicker value={form.date_of_birth} max={TODAY}
                onChange={(v) => setForm((f) => ({ ...f, date_of_birth: v }))} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              placeholder="Street, City, Country"
              className="inp w-full resize-none"
            />
          </div>

          {isEdit && (
            <div className="rounded-xl p-3 text-xs surface flex items-start gap-2">
              <Lock size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-400">
                Passwords can't be changed here for security. To reset it, the employee should go to the
                <span className="text-violet-400 font-medium"> login page → “Forgot password?” </span>
                and follow the email link.
              </span>
            </div>
          )}

          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider pt-2">Employment Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Department" {...field('department_id')}>
              <option value="">No department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Input label="Job Title" placeholder="e.g. Software Engineer" {...field('job_title')} />
            <Select label="Employment Type" {...field('employment_type')}>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
            </Select>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hire Date *</label>
              <DatePicker value={form.hire_date}
                onChange={(v) => setForm((f) => ({ ...f, hire_date: v }))} error={errors.hire_date?.[0]} />
              {errors.hire_date && <p className="text-xs text-red-400">{errors.hire_date[0]}</p>}
            </div>
            <Input label="Salary" type="number" placeholder="60000" min="0" {...field('salary')} />
            <Select label="Status" {...field('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            {isAdmin && (
              <Select label="System Role" {...field('role')}>
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
              </Select>
            )}
          </div>

          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider pt-2">Shift &amp; Schedule</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift Start</label>
              <TimePicker value={form.shift_start_time} onChange={(v) => setForm((f) => ({ ...f, shift_start_time: v }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift End</label>
              <TimePicker value={form.shift_end_time} onChange={(v) => setForm((f) => ({ ...f, shift_end_time: v }))} />
            </div>
            <Input label="Required Hours" type="number" step="0.5" min="1" max="24" placeholder="8"
              name="shift_required_minutes"
              value={form.shift_required_minutes ? form.shift_required_minutes / 60 : ''}
              onChange={(e) => setForm((f) => ({ ...f, shift_required_minutes: e.target.value ? Math.round(Number(e.target.value) * 60) : '' }))}
              error={errors.shift_required_minutes?.[0]}
            />
          </div>
          <p className="text-xs text-slate-500">Leave shift hours empty to use the company default (8h).</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5 mt-4" style={{ borderTop: '1px solid var(--surface-border)' }}>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1 justify-center">
            {isEdit ? 'Save Changes' : 'Add Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
