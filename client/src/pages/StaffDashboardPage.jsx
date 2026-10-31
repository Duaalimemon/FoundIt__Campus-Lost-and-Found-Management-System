import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';

export default function StaffDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-border dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900/60 px-2.5 py-1 rounded">
            Staff Administrative Portal
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">
            Overview Dashboard
          </h1>
          <p className="text-sm text-muted dark:text-slate-400 mt-0.5">
            Signed in as <strong className="text-slate-800 dark:text-slate-200">{user?.username || 'Staff Officer'}</strong> ({user?.role || 'staff'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/login">
            <Button variant="outline" size="sm">
              Student Portal
            </Button>
          </Link>
          <Link to="/staff/claims">
            <Button variant="primary" size="sm">
              Manage Claims Queue
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Lost Items Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Lost Reports</h2>
            <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">3 Total</div>
          <div className="flex items-center gap-3 text-xs text-muted dark:text-slate-400">
            <span className="text-amber-700 dark:text-amber-400 font-medium">2 Open</span>
            <span>&bull;</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">1 Resolved</span>
          </div>
        </div>

        {/* Found Items Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Found Inventory</h2>
            <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V3.75" />
              </svg>
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">3 Total</div>
          <div className="flex items-center gap-3 text-xs text-muted dark:text-slate-400">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">2 Available</span>
            <span>&bull;</span>
            <span className="text-blue-700 dark:text-blue-400 font-medium">1 Claimed</span>
          </div>
        </div>

        {/* Claims Queue Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Claim Requests</h2>
            <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">1 Active</div>
          <div className="flex items-center gap-3 text-xs text-muted dark:text-slate-400">
            <span className="text-slate-700 dark:text-slate-300 font-medium">1 Pending</span>
            <span>&bull;</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">0 Approved</span>
          </div>
        </div>
      </div>

      {/* Staff Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Claims Review Center</h2>
          <p className="text-xs text-muted dark:text-slate-400 mb-4 leading-relaxed">
            Review submitted proof descriptions, approve matches (updating items to <em>claimed</em>), or record rejection notes.
          </p>
          <Link to="/staff/claims">
            <Button variant="primary" size="sm">
              Open Claims Management &rarr;
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Inventory Inspection</h2>
          <p className="text-xs text-muted dark:text-slate-400 mb-4 leading-relaxed">
            Inspect all campus lost and found listings with staff privileges (unmasked reporter and finder details).
          </p>
          <div className="flex items-center gap-3">
            <Link to="/lost">
              <Button variant="outline" size="sm">
                Lost Directory
              </Button>
            </Link>
            <Link to="/found">
              <Button variant="outline" size="sm">
                Found Inventory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
