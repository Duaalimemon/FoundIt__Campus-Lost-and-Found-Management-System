import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Frontend route guard for staff-only areas.
 * - Shows an accessible loading indicator while token verification is pending.
 * - Redirects to /staff/login preserving destination in query param and location state when unauthenticated.
 * - Renders nested content (<Outlet /> or children) when authenticated.
 */
export default function ProtectedRoute({ children, allowedRole = 'staff' }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Loading state during initial session verification
  if (isLoading) {
    return (
      <div
        className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <div
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-muted">
          Verifying staff credentials...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to login preserving destination
  if (!isAuthenticated) {
    const redirectUrl = `/staff/login?redirect=${encodeURIComponent(
      location.pathname + location.search
    )}`;
    return <Navigate to={redirectUrl} state={{ from: location }} replace />;
  }

  // 3. Authenticated but unauthorized role: Prevent non-staff access to staff routes (Gate 8C-A)
  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  // 4. Authenticated & Authorized: Render protected content
  return children ? children : <Outlet />;
}
