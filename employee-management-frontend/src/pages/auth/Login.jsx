import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else toast.error(data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Heading — centered */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Welcome back</h2>
        <p className="text-sm text-slate-500 mt-2">Sign in to your account to continue</p>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Mail size={17} />
          </span>
          <input
            type="email"
            name="email"
            placeholder="admin@yopmail.com"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className={`inp w-full pl-12 ${errors.email ? 'err' : ''}`}
          />
        </div>
        {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
          <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Lock size={17} />
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            className={`inp w-full pl-12 pr-12 ${errors.password ? 'err' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
      </div>

      {/* Submit */}
      <Button type="submit" loading={loading} className="w-full justify-center py-3.5 text-base">
        Sign In <ArrowRight size={17} />
      </Button>

      {/* Demo credentials — centered */}
      <div
        className="rounded-xl p-4 text-center"
        style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)' }}
      >
        <p className="text-xs font-semibold text-violet-400 mb-1.5 flex items-center justify-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400" />
          Demo Credentials
        </p>
        <p className="text-xs text-slate-400 font-mono">admin@yopmail.com / password</p>
      </div>
    </form>
  );
}
