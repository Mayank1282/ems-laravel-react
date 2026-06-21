import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.errors?.email?.[0] || data?.message || 'Failed to send reset link.';
      toast.error(msg); // top toast only
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-5 py-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Check your email</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            We've sent a password reset link to{' '}
            <span className="text-violet-400 font-medium">{email}</span>
          </p>
        </div>
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors font-semibold">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Forgot password?</h2>
        <p className="text-sm text-slate-500 mt-2">Enter your email and we'll send you a reset link</p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Mail size={17} />
          </span>
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            required
            className={`inp w-full pl-12 ${error ? 'err' : ''}`}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <Button type="submit" loading={loading} className="w-full justify-center py-3">
        Send Reset Link
      </Button>

      <p className="text-center">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-400 transition-colors">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </p>
    </form>
  );
}
