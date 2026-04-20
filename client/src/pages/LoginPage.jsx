// LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HERO_BG = 'https://static.prod-images.emergentagent.com/jobs/21c4ead7-8d22-49ca-8219-134df3c9901b/images/551640e87425f247df4ff054683acfcf0b32ec86d8781185480bd73c4b340037.png';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(form.email, form.password);
    if (result.success) navigate('/lake');
    else setError(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-lake-bg/20 to-lake-bg" />
        <div className="relative z-10 flex flex-col justify-center p-16">
          <Sparkles className="w-10 h-10 text-gold mb-6" />
          <h2 className="font-heading text-5xl text-white tracking-tighter mb-4 leading-tight">
            Welcome back<br />to the <span className="gradient-gold italic">Lake</span>
          </h2>
          <p className="text-slate-400 font-body text-lg max-w-xs leading-relaxed">
            Your wishes are waiting. The lake remembers you.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 lg:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-gold" />
              <span className="font-heading text-xl text-white">Wishing Lake</span>
            </Link>
            <h1 className="font-heading text-3xl text-white mb-1">Sign in</h1>
            <p className="text-slate-400 text-sm font-body">Enter the lake</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com" required className="input-field pl-10" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-gold hover:text-gold-light transition-colors font-body">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••" required className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPass(o => !o)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3.5 mt-2 disabled:opacity-60">
              {loading ? <div className="w-5 h-5 rounded-full border-2 border-lake-bg border-t-transparent animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 font-body mt-6">
            New to the lake?{' '}
            <Link to="/signup" className="text-gold hover:text-gold-light transition-colors">Create an account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      setError('Password needs uppercase, lowercase, and a number');
      return;
    }
    setLoading(true);
    const result = await register(form);
    if (result.success) navigate('/lake');
    else setError(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-lake-bg/20 to-lake-bg" />
        <div className="relative z-10 flex flex-col justify-center p-16">
          <span className="text-5xl mb-6">🌙</span>
          <h2 className="font-heading text-5xl text-white tracking-tighter mb-4 leading-tight">
            Join the <span className="gradient-gold italic">Wishing Lake</span>
          </h2>
          <p className="text-slate-400 font-body text-lg max-w-xs leading-relaxed">
            Drop your first wish and let the magic find you.
          </p>
          <div className="flex gap-6 mt-10">
            {[['12K+', 'Wishers'], ['8K+', 'Fulfilled'], ['100%', 'Free']].map(([v, l]) => (
              <div key={l}>
                <p className="font-heading text-2xl gradient-gold">{v}</p>
                <p className="text-xs text-slate-500 font-body">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 lg:max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-gold" />
              <span className="font-heading text-xl text-white">Wishing Lake</span>
            </Link>
            <h1 className="font-heading text-3xl text-white mb-1">Create account</h1>
            <p className="text-slate-400 text-sm font-body">Your journey begins here</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Username</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="stargazer" required className="input-field" />
              </div>
              <div>
                <label className="label">Display Name</label>
                <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="Star Gazer" className="input-field" />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com" required className="input-field" />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 8 chars, uppercase + number" required className="input-field pr-10" />
                <button type="button" onClick={() => setShowPass(o => !o)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3.5 mt-2 disabled:opacity-60">
              {loading
                ? <div className="w-5 h-5 rounded-full border-2 border-lake-bg border-t-transparent animate-spin" />
                : <><Sparkles className="w-4 h-4" /> Join the Lake</>}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-4 font-body leading-relaxed">
            By joining, you agree to our magical terms of service ✨
          </p>
          <p className="text-center text-sm text-slate-500 font-body mt-3">
            Already a wisher?{' '}
            <Link to="/login" className="text-gold hover:text-gold-light transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginPage;
