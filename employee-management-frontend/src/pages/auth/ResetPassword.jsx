import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, ArrowLeft, Eye, EyeOff, KeyRound, AlertTriangle, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

function PasswordField({ name, label, placeholder, value, error, visible, onChange, onToggle }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"><Lock size={17} /></span>
        <input
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          required
          minLength={8}
          className={`inp w-full pl-12 pr-12 ${error ? 'err' : ''}`}
        />
        <button type="button" onClick={() => onToggle(name)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  // independent visibility for each field
  const [show, setShow] = useState({ password: false, password_confirmation: false });
  // token state: 'checking' | 'valid' | 'invalid'
  const [tokenState, setTokenState] = useState('checking');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token || !email) { setTokenState('invalid'); return; }
    authService.validateResetToken({ token, email })
      .then(({ data }) => setTokenState(data.data.valid ? 'valid' : 'invalid'))
      .catch(() => setTokenState('invalid'));
  }, [token, email]);

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    else if (form.password.length > 50) e.password = 'Password must not exceed 50 characters.';
    if (!form.password_confirmation) e.password_confirmation = 'Please confirm your password.';
    else if (form.password !== form.password_confirmation) e.password_confirmation = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const clientErrors = validate();
    if (Object.keys(clientErrors).length) { setErrors(clientErrors); return; }

    setLoading(true);
    try {
      await authService.resetPassword({ token, email, ...form });
      setDone(true);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        // Route Laravel's errors to the right field.
        const mapped = {};
        Object.entries(data.errors).forEach(([key, msgs]) => {
          const msg = Array.isArray(msgs) ? msgs[0] : msgs;
          if (key === 'password' && /confirm/i.test(msg)) mapped.password_confirmation = msg;
          else mapped[key] = msg;
        });
        setErrors(mapped);
      } else {
        toast.error(data?.message || 'Reset failed. The link may have expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center space-y-5 py-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Password reset successful</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Your password has been updated. You can now sign in with your new password.
          </p>
        </div>
        <Link to="/login">
          <Button className="justify-center px-6">Return to sign in</Button>
        </Link>
      </div>
    );
  }

  if (tokenState === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Verifying reset link…</p>
      </div>
    );
  }

  if (tokenState === 'invalid') {
    return (
      <div className="text-center space-y-5 py-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertTriangle size={30} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Link expired or already used</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            This reset link is no longer valid. Reset links can be used only once.
            Please request a new one to continue.
          </p>
        </div>
        <Link to="/forgot-password">
          <Button className="justify-center px-6">Request a new link</Button>
        </Link>
        <p>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-400 transition-colors">
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  const toggle = (name) => setShow((s) => ({ ...s, [name]: !s[name] }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <KeyRound size={24} className="text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Reset password</h2>
        <p className="text-sm text-slate-500 mt-2">for <span className="text-violet-400">{email}</span></p>
      </div>

      <PasswordField name="password" label="New Password" placeholder="Min 8 characters"
        value={form.password} error={errors.password} visible={show.password} onChange={setField} onToggle={toggle} />
      <PasswordField name="password_confirmation" label="Confirm Password" placeholder="Repeat password"
        value={form.password_confirmation} error={errors.password_confirmation} visible={show.password_confirmation} onChange={setField} onToggle={toggle} />

      <Button type="submit" loading={loading} className="w-full justify-center py-3.5 text-base">
        Reset Password
      </Button>

      <p className="text-center">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-400 transition-colors">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </p>
    </form>
  );
}
