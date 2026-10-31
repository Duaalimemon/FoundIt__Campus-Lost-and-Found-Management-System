import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { studentForgotPassword } from '../api/auth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorAlert from '../components/common/ErrorAlert';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StudentForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your campus email address.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please provide a valid campus email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await studentForgotPassword({ email: trimmedEmail });
      setSuccessMessage(
        response?.message ||
          'If an account exists with that email address, you will receive password reset instructions shortly.'
      );
      setSubmitted(true);
    } catch (err) {
      setError(
        err.message ||
          'Failed to process password reset request. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setEmail('');
    setError(null);
    setSuccessMessage('');
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
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Forgot Password
          </h1>
          <p className="text-sm text-muted dark:text-slate-400 mt-1">
            Enter your campus email to receive password reset instructions.
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {submitted ? (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-border dark:border-slate-800 shadow-sm space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/70 text-green-600 dark:text-green-400 mb-1">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Check Your Email
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {successMessage}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 text-xs text-slate-600 dark:text-slate-400 space-y-2 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Password reset links expire in <strong>15 minutes</strong> for security.</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Check your spam or junk folder if the email does not arrive shortly.</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link to="/login" className="block w-full">
                <Button variant="primary" fullWidth>
                  Return to Student Sign In
                </Button>
              </Link>

              <button
                type="button"
                onClick={handleResetForm}
                className="w-full text-center text-xs text-primary dark:text-blue-400 hover:underline py-1"
              >
                Send another request or try a different email
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-xl border border-border dark:border-slate-800 shadow-sm space-y-5"
          >
            <Input
              label="Campus Email Address"
              id="student-forgot-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              required
              autoFocus
              disabled={loading}
              helperText="We'll send a single-use password reset link to this address."
            />

            <Button
              variant="primary"
              type="submit"
              fullWidth
              loading={loading}
            >
              Send Reset Instructions
            </Button>

            <div className="pt-2 text-center text-xs text-muted dark:text-slate-400 space-y-2">
              <div>
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary dark:text-blue-400 hover:underline"
                >
                  Sign in here
                </Link>
              </div>
              <div>
                <Link
                  to="/"
                  className="hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  &larr; Return to Public Home
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

