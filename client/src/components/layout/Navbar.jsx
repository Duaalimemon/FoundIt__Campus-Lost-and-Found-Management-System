import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [signOutRole, setSignOutRole] = useState(null); // 'student' | 'staff'

  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { isStudent, studentUser, studentLogout, isStaff, staffUser, staffLogout } = useAuth();

  // Role & portal context detection
  const isStaffRoute = location.pathname.startsWith('/staff');
  const isStaffView = Boolean(isStaff && staffUser && (isStaffRoute || !isStudent));
  const isStudentView = Boolean(!isStaffView && isStudent && studentUser);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleRequestSignOut = (role = 'student') => {
    setSignOutRole(role);
    setIsSignOutModalOpen(true);
  };

  const handleConfirmSignOut = () => {
    if (signOutRole === 'staff') {
      staffLogout();
      if (isStaffRoute) {
        navigate('/staff/login');
      }
    } else {
      studentLogout();
      if (location.pathname === '/profile') {
        navigate('/login');
      }
    }
    setIsSignOutModalOpen(false);
    setSignOutRole(null);
    closeMobileMenu();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const publicNavLinks = [
    { name: 'Home', path: '/', end: true },
    { name: 'Lost Items', path: '/lost', end: true },
    { name: 'Found Items', path: '/found', end: true },
    { name: 'Report Lost', path: '/lost/new' },
    { name: 'Report Found', path: '/found/new' }
  ];

  const staffNavLinks = [
    { name: 'Staff Dashboard', path: '/staff/dashboard', end: true },
    { name: 'Staff Claims', path: '/staff/claims', end: true },
    { name: 'Lost Directory', path: '/lost', end: true },
    { name: 'Found Inventory', path: '/found', end: true }
  ];

  const navLinks = isStaffView ? staffNavLinks : publicNavLinks;

  const getNavLinkClass = ({ isActive }) =>
    `px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
      isActive
        ? isStaffView
          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-semibold'
          : 'bg-blue-50 dark:bg-blue-950/70 text-primary dark:text-blue-400 font-semibold'
        : isStaffView
          ? 'text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
    }`;

  const getMobileNavLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
      isActive
        ? isStaffView
          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-semibold'
          : 'bg-blue-50 dark:bg-blue-950/70 text-primary dark:text-blue-400 font-semibold'
        : isStaffView
          ? 'text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 shadow-md dark:shadow-slate-950/50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 lg:gap-4">
            {/* Brand Logo */}
            <div className="flex items-center shrink-0">
              <Link
                to={isStaffView ? '/staff/dashboard' : '/'}
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-primary dark:text-blue-400 font-bold text-xl tracking-tight focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded shrink-0"
              >
                <svg
                  className="w-7 h-7 text-primary dark:text-blue-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="text-slate-900 dark:text-white font-extrabold whitespace-nowrap">FoundIt</span>
                {isStaffView ? (
                  <span className="hidden sm:inline-block text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 whitespace-nowrap">
                    Staff Portal
                  </span>
                ) : (
                  <span className="hidden xl:inline-block text-xs font-normal text-muted dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    Campus Lost &amp; Found
                  </span>
                )}
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 shrink-0" aria-label="Main Navigation">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.end}
                  className={getNavLinkClass}
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* Right Action: Theme Toggle, User Identity, Navigation & Sign Out */}
            <div className="hidden lg:flex items-center space-x-2 shrink-0">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 shrink-0"
              >
                {isDark ? (
                  <svg
                    className="w-5 h-5 text-amber-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-slate-600 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                    />
                  </svg>
                )}
              </button>

              {/* Staff Auth Actions (Rendered only when Staff view is active) */}
              {isStaffView && (
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
                  {/* Non-clickable Staff Identity Badge */}
                  <div
                    className="flex items-center gap-2 py-1 px-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 shrink-0"
                    title={`Signed in as ${staffUser.username || staffUser.name || 'Staff'}`}
                  >
                    <div
                      className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      {getInitials(staffUser.username || staffUser.name || 'Staff')}
                    </div>
                    <span
                      className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] xl:max-w-[140px] truncate block whitespace-nowrap"
                    >
                      {staffUser.username || staffUser.name || 'Staff'}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0 whitespace-nowrap">
                      Staff
                    </span>
                  </div>

                  {/* Exactly ONE Sign Out Button for Staff */}
                  <button
                    type="button"
                    onClick={() => handleRequestSignOut('staff')}
                    aria-label="Sign out of staff account"
                    className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 rounded-md transition-colors whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    Sign Out
                  </button>
                </div>
              )}

              {/* Student Auth Actions (Rendered only when Student view is active) */}
              {isStudentView && (
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
                  {/* Non-clickable Student Identity Badge */}
                  <div
                    className="flex items-center gap-2 py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shrink-0"
                    title={`Signed in as ${studentUser.name} (${studentUser.email})`}
                  >
                    <div
                      className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-primary/20 dark:border-blue-700 text-primary dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      {getInitials(studentUser.name)}
                    </div>
                    <span
                      className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] xl:max-w-[140px] truncate block whitespace-nowrap"
                    >
                      {studentUser.name}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0 whitespace-nowrap">
                      Student
                    </span>
                  </div>

                  {/* Single Profile Navigation Entry */}
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/70 text-primary dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800'
                          : 'text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                      }`
                    }
                  >
                    Profile
                  </NavLink>

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    onClick={() => handleRequestSignOut('student')}
                    aria-label="Sign out of student account"
                    className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 rounded-md transition-colors whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    Sign Out
                  </button>
                </div>
              )}

              {/* Unauthenticated Actions */}
              {!isStaffView && !isStudentView && (
                <div className="flex items-center space-x-1 pl-1 shrink-0">
                  <Link
                    to="/login"
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-primary dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-blue-900 rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Staff Portal Shortcut (Shown only when unauthenticated and not already on /staff routes) */}
              {!isStaffView && !isStudentView && !isStaffRoute && (
                <Link
                  to="/staff/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-slate-900"
                >
                  <svg
                    className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span>Staff Portal</span>
                </Link>
              )}
            </div>

            {/* Mobile Right Controls: Theme Toggle & Menu Button */}
            <div className="flex items-center space-x-1 lg:hidden">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary shrink-0"
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary shrink-0"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {mobileMenuOpen ? (
                  <svg
                    className="w-6 h-6 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="lg:hidden border-t border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-2 shadow-lg transition-colors duration-200">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.end}
                  onClick={closeMobileMenu}
                  className={getMobileNavLinkClass}
                >
                  {link.name}
                </NavLink>
              ))}
            </div>

            {/* Mobile Auth Section */}
            {isStaffView ? (
              <div className="pt-2 pb-2 border-t border-border dark:border-slate-800 space-y-2 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      {getInitials(staffUser.username || staffUser.name || 'Staff')}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white block truncate">
                        {staffUser.username || staffUser.name || 'Staff User'}
                      </span>
                      <span className="text-xs text-muted dark:text-slate-400 block truncate">
                        Authorized Officer
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0 whitespace-nowrap">
                    Staff
                  </span>
                </div>
                <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleRequestSignOut('staff')}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-800 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded transition-colors whitespace-nowrap"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : isStudentView ? (
              <div className="pt-2 pb-2 border-t border-border dark:border-slate-800 space-y-2 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-primary/20 text-primary dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      {getInitials(studentUser.name)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white block truncate">
                        {studentUser.name}
                      </span>
                      <span className="text-xs text-muted dark:text-slate-400 block truncate">
                        {studentUser.email}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0 whitespace-nowrap">
                    Student
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="inline-flex items-center text-xs font-semibold text-primary dark:text-blue-400 hover:underline"
                  >
                    View My Profile &rarr;
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRequestSignOut('student')}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-800 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded transition-colors whitespace-nowrap"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-border dark:border-slate-800 grid grid-cols-2 gap-2 px-1">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="text-center px-3 py-2 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="text-center px-3 py-2 rounded-md text-xs font-semibold text-white bg-primary hover:bg-blue-900 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            <div className="pt-2 pb-1 border-t border-border dark:border-slate-800 flex items-center justify-between px-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Appearance
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {isDark ? '☀️ Light' : '🌙 Dark'}
              </button>
            </div>

            {!isStaffView && !isStudentView && !isStaffRoute && (
              <div className="pt-2 border-t border-border dark:border-slate-800">
                <Link
                  to="/staff/login"
                  onClick={closeMobileMenu}
                  className="block w-full text-center px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  Staff Portal Login
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Sign-Out Confirmation Modal */}
      <Modal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Confirm Sign Out"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsSignOutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="button"
              onClick={handleConfirmSignOut}
            >
              Sign Out
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to sign out of your {signOutRole === 'staff' ? 'staff portal session' : 'FoundIt student account'}?
        </p>
      </Modal>
    </>
  );
}
