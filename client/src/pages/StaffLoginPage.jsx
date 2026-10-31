import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorAlert from '../components/common/ErrorAlert';

export default function StaffLoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Determine post-login redirect destination
  const searchParams = new URLSearchParams(location.search);
  const redirectDestination = searchParams.get('redirect') || location.state?.from?.pathname || '/staff/dashboard';

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectDestination, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectDestination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate(redirectDestination, { replace: true });
    } catch (err) {
      if (err.isTimeout) {
        setError('Login request timed out. The server took longer than expected to respond (e.g. serverless cold start). Please try again in a moment.');
      } else if (err.retryAfter) {
        const minutes = Math.ceil(err.retryAfter / 60);
        const waitText = minutes > 1 ? `${minutes} minutes` : '1 minute';
        setError(`Too many login attempts. Please wait ${waitText} before trying again.`);
      } else {
        setError(err.message || 'Authentication failed. Please verify staff username and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        {/* Brand and Lock Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/70 text-primary dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Staff Portal Login
          </h1>
          <p className="text-sm text-muted dark:text-slate-400 mt-1">
            Sign in to access management dashboards and review claims.
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorAlert
              message={error}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-xl border border-border dark:border-slate-800 shadow-sm space-y-5">
          <Input
            label="Staff Username"
            id="staff-username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. admin"
            required
            autoFocus
            disabled={loading}
          />

          <Input
            label="Password"
            id="staff-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            disabled={loading}
          />

          <Button
            variant="primary"
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Sign In to Staff Portal
          </Button>

          <div className="pt-2 text-center">
            <Link to="/" className="text-xs text-muted dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors">
              &larr; Return to Public Home
            </Link>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-muted dark:text-slate-400 space-y-2">
          <p>
            Are you a student?{' '}
            <Link to="/login" className="font-medium text-primary dark:text-blue-400 hover:underline">
              Student Login
            </Link>
          </p>
          <p>Restricted to authorized campus security and property management personnel.</p>
        </div>
      </div>
    </div>
  );
}
