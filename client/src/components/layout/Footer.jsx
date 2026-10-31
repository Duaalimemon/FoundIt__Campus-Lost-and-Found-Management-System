import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-border dark:border-slate-800 mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-2 text-primary dark:text-blue-400 font-bold text-lg mb-3">
              <svg
                className="w-5 h-5 text-primary dark:text-blue-400"
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
              <span className="text-slate-900 dark:text-white">FoundIt</span>
            </div>
            <p className="text-sm text-muted dark:text-slate-400 leading-relaxed mb-3">
              Campus Lost &amp; Found Management System. Facilitating safe, privacy-protected reporting of lost belongings and transparent ownership claims across campus.
            </p>
            <span className="inline-block text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
              MERN Semester Project
            </span>
          </div>

          {/* Quick Navigation Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
              Quick Navigation
            </h3>
            <ul className="space-y-2 text-sm text-muted dark:text-slate-400">
              <li>
                <Link to="/" className="hover:text-primary dark:hover:text-blue-400 transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/lost" className="hover:text-primary dark:hover:text-blue-400 transition-colors">
                  Browse Lost Items
                </Link>
              </li>
              <li>
                <Link to="/found" className="hover:text-primary dark:hover:text-blue-400 transition-colors">
                  Browse Found Items
                </Link>
              </li>
              <li>
                <Link to="/lost/new" className="hover:text-primary dark:hover:text-blue-400 transition-colors">
                  Report a Lost Item
                </Link>
              </li>
              <li>
                <Link to="/found/new" className="hover:text-primary dark:hover:text-blue-400 transition-colors">
                  Register a Found Item
                </Link>
              </li>
              <li>
                <Link to="/staff/login" className="hover:text-primary dark:hover:text-blue-400 transition-colors">
                  Staff Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus Office Details */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
              Campus Property Office
            </h3>
            <div className="text-sm text-muted dark:text-slate-400 space-y-1.5 leading-relaxed">
              <p className="font-medium text-slate-700 dark:text-slate-300">Campus Security &amp; Services</p>
              <p>Room 101, Student Center Ground Floor</p>
              <p>Operating Hours: Mon – Fri, 8:30 AM – 5:00 PM</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                Personal contact details submitted with reports are protected and only accessible to authorized staff for claim verification.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 border-t border-border dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-muted dark:text-slate-400 gap-2">
          <p>
            FoundIt &copy; {currentYear} Campus Lost &amp; Found System. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 dark:text-slate-500">Strict Privacy Projections Enforced</span>
            <span>&bull;</span>
            <Link to="/staff/login" className="hover:text-primary dark:hover:text-blue-400 transition-colors">
              Staff Access
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
