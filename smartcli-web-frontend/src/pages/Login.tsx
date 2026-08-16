import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Github, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/boltUtils';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/Input';
import { useAuth, useToast } from '../context/AppContext';

type Mode = 'login' | 'signup' | 'reset';

export default function Login() {
  const { signIn, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (mode !== 'reset') {
      if (!password) errs.password = 'Password is required';
      else if (mode === 'signup' && password.length < 8) errs.password = 'Password must be at least 8 characters';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      if (mode === 'reset') {
        await new Promise((r) => setTimeout(r, 1000));
        showToast('Password reset email sent', 'success');
        setMode('login');
      } else {
        await signIn(email, password);
        showToast('Signed in successfully', 'success');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/Header_logo.png" alt="SmartCLI" className="h-12 w-auto object-contain mb-4" />
          <h1 className="text-xl font-bold text-slate-100">
            {mode === 'login' ? 'Sign in to SmartCLI' : mode === 'signup' ? 'Create your account' : 'Reset password'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'login' ? 'Welcome back.' : mode === 'signup' ? 'Start composing commands.' : 'Enter your email to receive a reset link.'}
          </p>
        </div>

        <div className="bg-navy-850 border border-navy-700 rounded-2xl p-6">
          {/* Social auth */}
          {mode !== 'reset' && (
            <div className="space-y-2 mb-6">
              <Button
                variant="secondary"
                className="w-full"
                leftIcon={<Github className="w-4 h-4" />}
                onClick={() => { showToast('GitHub OAuth demo — use email/password', 'info'); }}
              >
                Continue with GitHub
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                leftIcon={
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                }
                onClick={() => { showToast('Google OAuth demo — use email/password', 'info'); }}
              >
                Continue with Google
              </Button>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-navy-700" />
                <span className="text-xs text-slate-600">or</span>
                <div className="flex-1 h-px bg-navy-700" />
              </div>
            </div>
          )}

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            {mode !== 'reset' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-medium text-slate-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 text-slate-500 flex items-center h-full pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Minimum 8 characters' : '••••••••'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className={cn(
                      'w-full bg-navy-850 border rounded-lg text-sm text-slate-100 placeholder-slate-500',
                      'pl-9 pr-10 py-2 h-9',
                      'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500',
                      errors.password ? 'border-red-500' : 'border-navy-700'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
              </div>
            )}

            <Button variant="primary" className="w-full" type="submit" loading={loading}>
              {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </Button>
          </form>

          {/* Mode switching */}
          <div className="mt-4 text-center text-sm text-slate-400">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button onClick={() => setMode('signup')} className="text-cyan-400 hover:text-cyan-300">
                  Create one
                </button>
              </>
            ) : mode === 'signup' ? (
              <>
                Have an account?{' '}
                <button onClick={() => setMode('login')} className="text-cyan-400 hover:text-cyan-300">
                  Sign in
                </button>
              </>
            ) : (
              <button onClick={() => setMode('login')} className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 mx-auto">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-navy-800 text-center">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Continue as guest
            </Link>
          </div>
        </div>

        {/* Demo hint */}
        <div className="mt-4 text-center text-xs text-slate-600">
          Demo: use any email. "john@..." → Pro workspace.
        </div>
      </div>
    </div>
  );
}
