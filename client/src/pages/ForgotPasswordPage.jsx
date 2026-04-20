import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

// ── ForgotPasswordPage ────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Try again.', { className: 'toast-dark' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-3xl p-10 text-center">
        {sent ? (
          <>
            <Mail className="w-12 h-12 text-gold mx-auto mb-4" />
            <h1 className="font-heading text-3xl text-white mb-3">Check your inbox</h1>
            <p className="text-slate-400 font-body text-sm leading-relaxed mb-6">
              If an account with that email exists, we've sent a magic link to reset your password.
            </p>
            <Link to="/login" className="btn-primary justify-center w-full">Back to sign in</Link>
          </>
        ) : (
          <>
            <Sparkles className="w-10 h-10 text-gold mx-auto mb-4" />
            <h1 className="font-heading text-3xl text-white mb-2">Forgot password?</h1>
            <p className="text-slate-400 font-body text-sm mb-8">Enter your email and we'll send a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required className="input-field pl-10" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 disabled:opacity-60">
                {loading ? <div className="w-5 h-5 rounded-full border-2 border-lake-bg border-t-transparent animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
            <Link to="/login" className="block text-sm text-slate-500 hover:text-slate-300 mt-4 font-body transition-colors">
              Back to sign in
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── ResetPasswordPage ─────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      toast.success('Password reset! Please sign in.', { className: 'toast-dark' });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-3xl p-10">
        <div className="text-center mb-8">
          <Lock className="w-10 h-10 text-gold mx-auto mb-4" />
          <h1 className="font-heading text-3xl text-white mb-2">New password</h1>
          <p className="text-slate-400 text-sm font-body">Create a strong password for your account.</p>
        </div>
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">New password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Min 8 chars" required className="input-field pr-10" />
              <button type="button" onClick={() => setShowPass(o => !o)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password" required className="input-field" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 mt-2 disabled:opacity-60">
            {loading ? <div className="w-5 h-5 rounded-full border-2 border-lake-bg border-t-transparent animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── VerifyEmailPage ───────────────────────────────────────────────────────────
export function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    authAPI.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass rounded-3xl p-12 text-center">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin mx-auto mb-4" />
            <p className="font-body text-slate-400">Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
            <h1 className="font-heading text-3xl text-white mb-3">Email Verified! ✨</h1>
            <p className="text-slate-400 font-body text-sm mb-6">
              Welcome to the Wishing Lake. You've earned the "Verified Soul" badge!
            </p>
            <Link to="/lake" className="btn-primary justify-center">Enter the Lake</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h1 className="font-heading text-3xl text-white mb-3">Link Expired</h1>
            <p className="text-slate-400 font-body text-sm mb-6">
              This verification link has expired or is invalid. Please sign in to request a new one.
            </p>
            <Link to="/login" className="btn-primary justify-center">Go to Sign In</Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default ForgotPasswordPage;
