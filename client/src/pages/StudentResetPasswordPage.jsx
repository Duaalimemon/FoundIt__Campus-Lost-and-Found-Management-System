import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { studentResetPassword } from '../api/auth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorAlert from '../components/common/ErrorAlert';

export default function StudentResetPasswordPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token')?.trim() || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const isTokenMissing = !token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || resetSuccess) return;

    setError(null);

    if (isTokenMissing) {
      setError('Password reset token is missing from the link. Please request a new link.');
      return;
    }

    if (!password || password.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter both passwords.');
      return;
    }

    setLoading(true);

    try {
      const response = await studentResetPassword({
        token,
        password
      });

      setSuccessMessage(
        response?.message ||
          'Your password has been reset successfully. Please sign in with your new password.'
      );
      setResetSuccess(true);
      // Clear sensitive form state after successful reset
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        err.message ||
          'Password reset link is invalid or has expired. Please request a new link.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        {/* Header and Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/70 text-primary dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 mb-3">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-muted dark:text-slate-400 mt-1">
            Create a new secure password for your student account.
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {isTokenMissing ? (
          /* Missing Token State */
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-border dark:border-slate-800 shadow-sm space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 mb-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Missing Reset Token
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This password reset link appears to be incomplete or missing its token. Please request a new link using your registered email.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <Link to="/forgot-password" className="block w-full">
                <Button variant="primary" fullWidth>
                  Request a New Reset Link
                </Button>
              </Link>
              <Link
                to="/login"
                className="block text-center text-xs text-primary dark:text-blue-400 hover:underline py-1"
              >
                Return to Student Sign In
              </Link>
            </div>
          </div>
        ) : resetSuccess ? (
          /* Success State */
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-border dark:border-slate-800 shadow-sm space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/70 text-green-600 dark:text-green-400 mb-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Password Reset Complete
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {successMessage}
              </p>
            </div>
            <div className="pt-2">
              <Link to="/login" className="block w-full">
                <Button variant="primary" fullWidth>
                  Sign In with New Password
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Password Reset Form */
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-xl border border-border dark:border-slate-800 shadow-sm space-y-5"
          >
            <Input
              label="New Password"
              id="new-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoFocus
              disabled={loading}
              helperText="Must be at least 8 characters long."
            />

            <Input
              label="Confirm New Password"
              id="confirm-password"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={loading}
            />

            <Button
              variant="primary"
              type="submit"
              fullWidth
              loading={loading}
            >
              Reset Password
            </Button>

            <div className="pt-2 text-center text-xs text-muted dark:text-slate-400 space-y-2">
              <div>
                Need a new link?{' '}
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary dark:text-blue-400 hover:underline"
                >
                  Request another link
                </Link>
              </div>
              <div>
                <Link
                  to="/login"
                  className="hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  &larr; Return to Student Sign In
                </Link>
              </div>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-muted dark:text-slate-400">
          <p>
            Campus Staff?{' '}
            <Link to="/staff/login" className="text-primary dark:text-blue-400 hover:underline">
              Access Staff Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

