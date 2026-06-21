import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';

function Field({ icon: Icon, name, type = 'text', label, placeholder, autoComplete, value, onChange, error, toggle, visible, onToggle }) {
  const inputType = toggle ? (visible ? 'text' : 'password') : type;
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <Icon size={17} />
        </span>
        <input
          type={inputType}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          autoComplete={autoComplete}
          className={`inp w-full pl-12 ${toggle ? 'pr-12' : ''} ${error ? 'err' : ''}`}
        />
        {toggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ password: false, password_confirmation: false });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else toast.error(data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Create account</h2>
        <p className="text-sm text-slate-500 mt-2">Fill in your details to get started</p>
      </div>

      <Field icon={User} name="name" label="Full Name" placeholder="John Doe" autoComplete="name"
        value={form.name} onChange={handleChange} error={errors.name} />
      <Field icon={Mail} name="email" type="email" label="Email Address" placeholder="you@example.com" autoComplete="email"
        value={form.email} onChange={handleChange} error={errors.email} />
      <Field icon={Lock} name="password" label="Password" placeholder="Min 8 characters" autoComplete="new-password" toggle
        value={form.password} onChange={handleChange} error={errors.password}
        visible={show.password} onToggle={() => setShow((s) => ({ ...s, password: !s.password }))} />
      <Field icon={Lock} name="password_confirmation" label="Confirm Password" placeholder="Repeat password" autoComplete="new-password" toggle
        value={form.password_confirmation} onChange={handleChange} error={errors.password_confirmation}
        visible={show.password_confirmation} onToggle={() => setShow((s) => ({ ...s, password_confirmation: !s.password_confirmation }))} />

      <Button type="submit" loading={loading} className="w-full justify-center py-3.5 text-base mt-1">
        Create Account <ArrowRight size={16} />
      </Button>

      <p className="text-center text-sm text-slate-500 pt-1">
        Already have an account?{' '}
        <Link to="/login" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  );
}
