import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorAlert from '../components/common/ErrorAlert';

export default function StudentLoginPage() {
  const { studentLogin, studentGoogleLogin, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Determine post-login redirect destination
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const redirectDestination = redirectParam || location.state?.from?.pathname || '/';

  // If already authenticated as student, redirect immediately
  useEffect(() => {
    if (isStudent) {
      navigate(redirectDestination, { replace: true });
    }
  }, [isStudent, navigate, redirectDestination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    // Basic client validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Campus email address is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);

    try {
      await studentLogin({ email: trimmedEmail, password });
      navigate(redirectDestination, { replace: true });
    } catch (err) {
      if (err.isTimeout) {
        setError('Login request timed out. The server took longer than expected to respond (e.g. serverless cold start). Please try again in a moment.');
      } else if (err.retryAfter) {
        const minutes = Math.ceil(err.retryAfter / 60);
        const waitText = minutes > 1 ? `${minutes} minutes` : '1 minute';
        setError(`Too many login attempts. Please wait ${waitText} before trying again.`);
      } else {
        setError(err.message || 'Authentication failed. Please verify your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (loading) return;
    if (!credentialResponse?.credential) {
      setError('Google Sign-In did not return a valid credential. Please try again.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await studentGoogleLogin(credentialResponse.credential);
      navigate(redirectDestination, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      const code = data?.code;

      if (code === 'ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_GOOGLE_ACCOUNT') {
        setError(
          data?.message ||
            'This account is already linked to a different Google account. Please sign in with your original Google account or email and password.'
        );
      } else if (code === 'ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL' || status === 409) {
        setError(
          data?.message ||
            'An account with this email address already exists using email and password. Please sign in with your email and password.'
        );
      } else if (status === 403) {
        setError(
          data?.message || 'Google account email is not verified. Please verify your email with Google.'
        );
      } else if (status === 401) {
        setError('Google authentication failed: token was invalid or expired. Please try again.');
      } else if (status === 500 && data?.message?.includes('not configured')) {
        setError('Google Sign-In is not currently configured on the server. Please sign in with your password.');
      } else {
        setError(
          err.message || 'Google Sign-In encountered an unexpected error. Please check your connection and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or failed. Please try again.');
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        {/* Brand and Student Badge Icon */}
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
                d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Student Sign In
          </h1>
          <p className="text-sm text-muted dark:text-slate-400 mt-1">
            Sign in with your campus account to report lost items and submit claims.
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
            label="Campus Email Address"
            id="student-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@university.edu"
            required
            autoFocus
            disabled={loading}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="student-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Password <span className="text-danger ml-0.5" aria-hidden="true">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="student-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={loading}
            />
          </div>

          <Button
            variant="primary"
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Sign In
          </Button>

          {/* OR Divider */}
          <div className="relative my-3" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              shape="rectangular"
              theme="outline"
              size="large"
              text="signin_with"
              width="100%"
            />
          </div>

          <div className="pt-2 text-center text-xs text-muted dark:text-slate-400 space-y-2">
            <div>
              Don't have an account?{' '}
              <Link
                to={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
                className="font-medium text-primary dark:text-blue-400 hover:underline"
              >
                Register here
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

        <div className="mt-6 text-center text-xs text-muted dark:text-slate-400">
          <p>
            Are you a staff member?{' '}
            <Link to="/staff/login" className="font-medium text-primary dark:text-blue-400 hover:underline">
              Staff Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
