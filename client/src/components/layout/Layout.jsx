import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../../hooks/useTheme';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from '../common/ScrollToTop';

export default function Layout({ children }) {
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      <ScrollToTop />
      {/* Accessible skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:font-medium focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white dark:focus:ring-offset-slate-900"
      >
        Skip to main content
      </a>

      {/* Global Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: '14px',
            borderRadius: '8px',
            color: isDark ? '#F1F5F9' : '#0F172A',
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }
        }}
      />

      {/* Navigation Header */}
      <Navbar />

      {/* Main Page Content */}
      <main id="main-content" className="flex-grow w-full focus:outline-none" tabIndex="-1">
        {children || <Outlet />}
      </main>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}
