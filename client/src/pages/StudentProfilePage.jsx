import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getMyLostItems } from '../api/lostItems';
import { getMyClaims } from '../api/claims';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { formatDate } from '../utils/format';

export default function StudentProfilePage() {
  const location = useLocation();
  const { isStudent, studentUser, isLoading: isAuthLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('lost'); // 'lost' | 'claims'
  const [lostItems, setLostItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfileActivity = useCallback(async () => {
    if (!isStudent) return;
    setIsLoadingData(true);
    setError(null);

    try {
      const [lostRes, claimsRes] = await Promise.allSettled([
        getMyLostItems(),
        getMyClaims()
      ]);

      if (lostRes.status === 'fulfilled' && lostRes.value?.data) {
        setLostItems(Array.isArray(lostRes.value.data) ? lostRes.value.data : []);
      } else if (lostRes.status === 'rejected') {
        console.warn('Failed to load student lost items:', lostRes.reason);
      }

      if (claimsRes.status === 'fulfilled' && claimsRes.value?.data) {
        setClaims(Array.isArray(claimsRes.value.data) ? claimsRes.value.data : []);
      } else if (claimsRes.status === 'rejected') {
        console.warn('Failed to load student claims:', claimsRes.reason);
      }
    } catch (err) {
      setError('Failed to load account activity. Please refresh to try again.');
    } finally {
      setIsLoadingData(false);
    }
  }, [isStudent]);

  useEffect(() => {
    if (!isAuthLoading && isStudent) {
      fetchProfileActivity();
    }
  }, [isAuthLoading, isStudent, fetchProfileActivity]);

  // Auth Guard: If authentication check completed and not a student, redirect to login
  if (!isAuthLoading && !isStudent) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Loading state while verifying credentials
  if (isAuthLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" label="Loading student profile..." showLabel />
      </div>
    );
  }

  // Initials computation
  const initials = studentUser?.name
    ? studentUser.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ST';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: 'Home', to: '/' },
          { label: 'Student Profile' }
        ]}
      />

      {/* Account Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Initials Avatar Badge */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 dark:bg-blue-950/80 border-2 border-primary/20 dark:border-blue-800 text-primary dark:text-blue-300 font-bold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-inner"
              aria-hidden="true"
            >
              {initials}
            </div>

            {/* Student Details */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {studentUser?.name || 'Student Account'}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Student
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">
                {studentUser?.email}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted dark:text-slate-500">
                <span>
                  Member since {studentUser?.createdAt ? formatDate(studentUser.createdAt) : 'Recently'}
                </span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Verified Campus Member
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            <Link to="/lost/new">
              <Button variant="primary" size="sm" fullWidth>
                + Report Lost Item
              </Button>
            </Link>
            <Link to="/found">
              <Button variant="outline" size="sm" fullWidth>
                Browse Found Items
              </Button>
            </Link>
            <Link to="/staff/login">
              <Button variant="outline" size="sm" fullWidth>
                Staff Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Error alert if fetch failed */}
      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Activity Tabs */}
      <div className="mb-6 border-b border-border dark:border-slate-800 flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('lost')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'lost'
              ? 'text-primary dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          My Reported Lost Items ({lostItems.length})
          {activeTab === 'lost' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-blue-400 rounded-t" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'claims'
              ? 'text-primary dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          My Submitted Claims ({claims.length})
          {activeTab === 'claims' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-blue-400 rounded-t" />
          )}
        </button>
      </div>

      {/* Activity Content */}
      {isLoadingData ? (
        <div className="py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 shadow-sm">
          <LoadingSpinner size="md" label="Loading activity..." showLabel />
        </div>
      ) : activeTab === 'lost' ? (
        <div>
          {lostItems.length === 0 ? (
            <EmptyState
              title="No Lost Items Reported Yet"
              description="You have not submitted any lost item reports yet. If you misplaced property anywhere on campus, submit a report so security and staff can help find it."
              action={
                <Link to="/lost/new">
                  <Button variant="primary" size="sm">
                    Report a Lost Item
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lostItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                        {item.title}
                      </h2>
                      <StatusBadge status={item.status} />
                    </div>

                    <div className="text-xs text-muted dark:text-slate-400 space-y-1 mb-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Category:
                        </span>
                        <span>{item.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Last seen:
                        </span>
                        <span>{item.lastSeenLocation}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Date lost:
                        </span>
                        <span>{formatDate(item.dateLost)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-muted dark:text-slate-500">
                      Reported {formatDate(item.createdAt)}
                    </span>
                    <Link
                      to={`/lost/${item._id}`}
                      className="text-xs font-semibold text-primary dark:text-blue-400 hover:underline"
                    >
                      View Report &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {claims.length === 0 ? (
            <EmptyState
              title="No Claims Submitted Yet"
              description="You have not submitted any ownership claims. When an item matching your missing property is logged in the Found directory, submit a claim with verification proof."
              action={
                <Link to="/found">
                  <Button variant="primary" size="sm">
                    Browse Found Items
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claims.map((claim) => (
                <div
                  key={claim._id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                        {claim.foundItem?.title || 'Found Campus Property'}
                      </h2>
                      <StatusBadge status={claim.status} />
                    </div>

                    <div className="text-xs text-muted dark:text-slate-400 space-y-1 mb-4">
                      {claim.foundItem?.category && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Category:
                          </span>
                          <span>{claim.foundItem.category}</span>
                        </div>
                      )}
                      {claim.foundItem?.foundLocation && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Found location:
                          </span>
                          <span>{claim.foundItem.foundLocation}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Submitted on:
                        </span>
                        <span>{formatDate(claim.createdAt)}</span>
                      </div>
                      {claim.adminNote && (
                        <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs">
                          <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">
                            Staff Note:
                          </strong>
                          <span className="text-slate-600 dark:text-slate-300">
                            {claim.adminNote}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-muted dark:text-slate-500">
                      ID: {claim._id.slice(-6)}
                    </span>
                    {claim.foundItem?._id && (
                      <Link
                        to={`/found/${claim.foundItem._id}`}
                        className="text-xs font-semibold text-primary dark:text-blue-400 hover:underline"
                      >
                        View Item &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

