import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Toaster position="top-right" />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="py-6 text-center text-xs text-muted border-t border-border bg-white">
        FoundIt — Campus Lost &amp; Found Management System &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
