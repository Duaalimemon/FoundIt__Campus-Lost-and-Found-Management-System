import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export default function HomePage() {
  const [health, setHealth] = useState({ loading: true, status: null, error: null });

  useEffect(() => {
    apiClient.get('/health')
      .then((res) => {
        setHealth({
          loading: false,
          status: res.data?.status || 'ok',
          uptime: res.data?.uptime,
          error: null
        });
      })
      .catch((err) => {
        setHealth({
          loading: false,
          status: 'error',
          error: err.message || 'Unable to connect to API'
        });
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Brand Header */}
      <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-3">
          FoundIt
        </h1>
        <p className="text-lg text-muted">
          Campus Lost &amp; Found Management System
        </p>
      </header>

      {/* Walking Skeleton Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center justify-between">
          <span>Walking-Skeleton Pipeline Status</span>
          <span className="text-xs font-mono uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded">
            Phase 2
          </span>
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm font-medium text-slate-600">Frontend Client (Vite + React)</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              Running
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm font-medium text-slate-600">Express REST API Connection</span>
            {health.loading ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Checking /api/health...
              </span>
            ) : health.status === 'ok' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Healthy (200 OK)
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                Failed ({health.error})
              </span>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-slate-600">CORS Protection</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Configured from CLIENT_ORIGIN
            </span>
          </div>
        </div>
      </div>

      {/* Architecture Summary */}
      <div className="bg-slate-100/60 rounded-xl p-6 border border-slate-200 text-sm text-muted">
        <h3 className="font-semibold text-slate-800 mb-2">Next Scheduled Milestone: Phase 3</h3>
        <p>
          MongoDB Atlas connection, Mongoose schemas (LostItem, FoundItem, ClaimRequest), and seed script with test fixtures.
        </p>
      </div>
    </div>
  );
}
