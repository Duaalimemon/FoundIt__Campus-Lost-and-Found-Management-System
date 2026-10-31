import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { formatDate } from '../utils/format';
import { getFoundItemById } from '../api/foundItems';

export default function FoundItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'not_found' | 'invalid_id' | 'server'

  // Request sequence ref to prevent stale responses from overwriting newer requests
  const requestSeq = useRef(0);

  const fetchItem = useCallback(async () => {
    const currentSeq = ++requestSeq.current;
    setIsLoading(true);
    setError(null);
    setErrorType(null);
    setItem(null);

    // Validate ID format (24-character hexadecimal ObjectId)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      setIsLoading(false);
      setErrorType('invalid_id');
      setError('Invalid item identifier format.');
      return;
    }

    try {
      const res = await getFoundItemById(id);
      if (currentSeq === requestSeq.current && res?.data) {
        setItem(res.data);
      }
    } catch (err) {
      if (currentSeq === requestSeq.current) {
        const msg = err?.message || 'Failed to load found item details.';
        if (msg.toLowerCase().includes('not found')) {
          setErrorType('not_found');
          setError('The requested found item report was not found.');
        } else if (msg.toLowerCase().includes('validation') || err?.errors?.some((e) => e.field === 'id')) {
          setErrorType('invalid_id');
          setError('Invalid item reference identifier.');
        } else {
          setErrorType('server');
          setError(msg);
        }
      }
    } finally {
      if (currentSeq === requestSeq.current) {
        setIsLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const isAvailable = item?.status === 'available';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Found Items', to: '/found' },
          { label: item?.title || 'Item Details' }
        ]}
      />

      {/* Back navigation */}
      <div className="mb-6">
        <Link
          to="/found"
          className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Found Items Directory
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 shadow-sm p-8">
          <LoadingSpinner size="lg" label="Loading found item details..." showLabel />
        </div>
      )}

      {/* Error state: Not Found */}
      {!isLoading && errorType === 'not_found' && (
        <EmptyState
          title="Found Item Not Found"
          description={error || 'The requested found item report does not exist or may have been claimed.'}
          action={
            <Link to="/found">
              <Button variant="secondary" size="sm">
                Return to Found Items Directory
              </Button>
            </Link>
          }
        />
      )}

      {/* Error state: Invalid ID */}
      {!isLoading && errorType === 'invalid_id' && (
        <EmptyState
          title="Invalid Item Identifier"
          description="The item reference provided in the URL is not a valid 24-character identifier."
          action={
            <Link to="/found">
              <Button variant="secondary" size="sm">
                Return to Found Items Directory
              </Button>
            </Link>
          }
        />
      )}

      {/* Error state: Network/Server error */}
      {!isLoading && errorType === 'server' && (
        <div className="space-y-4">
          <ErrorAlert title="Failed to Load Item" message={error} />
          <div className="flex justify-center">
            <Button variant="secondary" size="sm" onClick={fetchItem}>
              Retry Loading
            </Button>
          </div>
        </div>
      )}

      {/* Main Detail Card */}
      {!isLoading && !error && item && (
        <article className="bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 shadow-sm overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            {/* Header & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900/60 px-2.5 py-1 rounded">
                {item.category || 'Other'}
              </span>
              <StatusBadge status={item.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              {item.title}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-slate-100 dark:border-slate-800 mb-6 text-sm">
              <div>
                <span className="text-xs text-muted dark:text-slate-400 uppercase font-semibold block mb-0.5">Found Location</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{item.foundLocation || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-xs text-muted dark:text-slate-400 uppercase font-semibold block mb-0.5">Date Found</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{formatDate(item.dateFound)}</span>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-2">Description</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                {item.description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Secure Storage Information */}
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3 mb-6">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <div>
                <strong className="font-semibold block mb-0.5">Secure Campus Storage:</strong>
                This item is safely secured at the Campus Security &amp; Services Office (Student Center, Room 101). To reclaim it, submit an ownership claim online or visit the office with valid photo ID.
              </div>
            </div>

            {/* Finder Privacy Callout */}
            <div className="text-xs text-muted dark:text-slate-400">
              <em>Privacy Protection: Finder details and storage security notes are restricted to authorized campus staff.</em>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-slate-50 dark:bg-slate-800/60 px-6 sm:px-8 py-4 border-t border-border dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-mono text-muted dark:text-slate-400">Item Reference ID: {item._id || id}</span>
            <div className="flex items-center gap-3">
              {isAvailable ? (
                <Link to={`/found/${item._id || id}/claim`}>
                  <Button variant="primary" size="md">
                    Claim This Item
                  </Button>
                </Link>
              ) : (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  This item is currently under claim review or returned.
                </span>
              )}
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
