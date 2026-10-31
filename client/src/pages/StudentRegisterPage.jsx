import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorAlert from '../components/common/ErrorAlert';

export default function StudentRegisterPage() {
  const { studentRegister, studentGoogleLogin, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Determine post-registration redirect destination
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const redirectDestination = redirectParam || location.state?.from?.pathname || '/';

  // If already authenticated as student, redirect immediately
  useEffect(() => {
    if (isStudent) {
      navigate(redirectDestination, { replace: true });
    }
  }, [isStudent, navigate, redirectDestination]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    // Basic client validation matching backend studentRegisterSchema
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please provide a valid campus email address.');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      await studentRegister({
        name: trimmedName,
        email: trimmedEmail,
        password: formData.password
      });
      navigate(redirectDestination, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
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
        {/* Brand and Registration Icon */}
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
                d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create Student Account
          </h1>
          <p className="text-sm text-muted dark:text-slate-400 mt-1">
            Register with your university email to track lost items and submit claims.
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
            label="Full Name"
            id="register-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Alex Morgan"
            helperText="At least 2 characters"
            required
            autoFocus
            disabled={loading}
          />

          <Input
            label="Campus Email Address"
            id="register-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="student@university.edu"
            helperText="University email address"
            required
            disabled={loading}
          />

          <Input
            label="Password"
            id="register-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            helperText="Minimum 8 characters"
            required
            disabled={loading}
          />

          <Button
            variant="primary"
            type="submit"
            fullWidth
            loading={loading}
          >
            Create Account
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
              text="signup_with"
              width="100%"
            />
          </div>

          <div className="pt-2 text-center text-xs text-muted dark:text-slate-400 space-y-2">
            <div>
              Already have an account?{' '}
              <Link
                to={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
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
