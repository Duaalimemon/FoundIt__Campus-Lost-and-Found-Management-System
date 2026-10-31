import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-black text-primary dark:text-blue-400 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Page Not Found</h2>
      <p className="text-muted dark:text-slate-400 max-w-md mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center px-4 py-2 bg-primary dark:bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}
