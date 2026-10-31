import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/common/Button';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import Textarea from '../components/common/Textarea';
import { CLAIM_STATUSES } from '../utils/constants';
import { formatDate } from '../utils/format';
import { getClaims, updateClaimStatus } from '../api/claims';

export default function StaffClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  const [actionError, setActionError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Rejection modal state
  const [rejectClaimTarget, setRejectClaimTarget] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [noteError, setNoteError] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Stale request guard
  const requestSeq = useRef(0);

  const fetchClaims = useCallback(async () => {
    const seq = ++requestSeq.current;
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: 12,
        ...(selectedStatus !== 'all' ? { status: selectedStatus } : {})
      };

      const res = await getClaims(params);

      if (seq === requestSeq.current) {
        if (res && res.data) {
          setClaims(Array.isArray(res.data) ? res.data : []);
          setMeta(
            res.meta || {
              page,
              limit: 12,
              total: Array.isArray(res.data) ? res.data.length : 0,
              totalPages: 1
            }
          );
        } else {
          setClaims([]);
        }
      }
    } catch (err) {
      if (seq === requestSeq.current) {
        setError(
          err.message || 'Failed to load claims queue. Please check your connection and try again.'
        );
      }
    } finally {
      if (seq === requestSeq.current) {
        setIsLoading(false);
      }
    }
  }, [page, selectedStatus]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleStatusFilterChange = (status) => {
    setSelectedStatus(status);
    setPage(1);
    setActionError(null);
  };

  const handleApprove = async (claimId) => {
    if (actionLoadingId) return;

    setActionLoadingId(claimId);
    setActionError(null);

    try {
      const res = await updateClaimStatus(claimId, { status: 'approved' });
      toast.success('Claim Approved Successfully', {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#FFFFFF',
          fontWeight: '500'
        }
      });
      await fetchClaims();
    } catch (err) {
      setActionError(err.message || 'Failed to approve claim. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectModal = (claim) => {
    setRejectClaimTarget(claim);
    setAdminNote('');
    setNoteError(null);
    setActionError(null);
  };

  const handleCloseRejectModal = useCallback(() => {
    if (isRejecting) return;
    setRejectClaimTarget(null);
    setAdminNote('');
    setNoteError(null);
  }, [isRejecting]);

  const handleConfirmReject = async () => {
    if (!rejectClaimTarget) return;

    const trimmedNote = adminNote.trim();
    if (trimmedNote.length < 5) {
      setNoteError('An admin note of at least 5 characters is required when rejecting a claim.');
      return;
    }

    setIsRejecting(true);
    setNoteError(null);

    try {
      const res = await updateClaimStatus(rejectClaimTarget._id, {
        status: 'rejected',
        adminNote: trimmedNote
      });

      toast.error('Claim Rejected Successfully', {
        duration: 3000,
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
          fontWeight: '500'
        }
      });
      setRejectClaimTarget(null);
      setAdminNote('');
      await fetchClaims();
    } catch (err) {
      setNoteError(err.message || 'Failed to reject claim. Please try again.');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Staff Dashboard', to: '/staff/dashboard' },
          { label: 'Claims Management' }
        ]}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-border dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Claims Management Queue
          </h1>
          <p className="text-sm text-muted dark:text-slate-400 mt-1">
            Review claimant ownership evidence, verify proof details, and transition claim states.
          </p>
        </div>

        <div>
          <Link to="/staff/dashboard">
            <Button variant="outline" size="sm">
              &larr; Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div className="mb-6">
          <ErrorAlert
            title="Claim Action Failed"
            message={actionError}
            onDismiss={() => setActionError(null)}
          />
        </div>
      )}

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mr-1">
          Filter:
        </span>
        <button
          type="button"
          onClick={() => handleStatusFilterChange('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            selectedStatus === 'all'
              ? 'bg-primary dark:bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-900 border border-border dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          All Claims
        </button>
        {CLAIM_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => handleStatusFilterChange(status)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              selectedStatus === status
                ? 'bg-primary dark:bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-border dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 shadow-sm p-8">
          <LoadingSpinner size="lg" label="Loading claim requests..." showLabel />
        </div>
      ) : error ? (
        <div className="mb-6">
          <ErrorAlert title="Failed to Load Claims" message={error}>
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={fetchClaims}>
                Retry
              </Button>
            </div>
          </ErrorAlert>
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          title="No claims matching the selected filter"
          description={
            selectedStatus === 'all'
              ? 'There are currently no ownership claims submitted in the system.'
              : `There are no claims currently in "${selectedStatus}" status.`
          }
          action={
            selectedStatus !== 'all' ? (
              <Button size="sm" variant="outline" onClick={() => handleStatusFilterChange('all')}>
                Show All Claims
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const isProcessing = actionLoadingId === claim._id;
            const targetItem =
              claim.foundItem && typeof claim.foundItem === 'object'
                ? claim.foundItem
                : null;
            const targetTitle = targetItem?.title || 'Referenced Item';
            const targetLocation = targetItem?.foundLocation || 'Location unspecified';
            const targetCategory = targetItem?.category || '';

            return (
              <div
                key={claim._id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted dark:text-slate-400">
                      Claim #{claim._id.slice(-6)}
                    </span>
                    <StatusBadge status={claim.status} />
                  </div>
                  <span className="text-xs text-muted dark:text-slate-400">
                    Submitted {formatDate(claim.createdAt)}
                  </span>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs uppercase font-semibold text-muted dark:text-slate-400 block mb-1">
                      Target Item
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {targetTitle}
                    </p>
                    <p className="text-xs text-muted dark:text-slate-400">
                      {targetCategory ? `${targetCategory} • ` : ''}
                      {targetLocation}
                    </p>
                    {targetItem?._id && (
                      <Link
                        to={`/found/${targetItem._id}`}
                        className="text-xs text-primary dark:text-blue-400 hover:underline inline-block mt-1"
                      >
                        View Item Report &rarr;
                      </Link>
                    )}
                  </div>

                  <div>
                    <span className="text-xs uppercase font-semibold text-muted dark:text-slate-400 block mb-1">
                      Claimant Contact
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {claim.claimantName}
                    </p>
                    <p className="text-xs text-muted dark:text-slate-400">
                      {claim.claimantEmail}
                      {claim.claimantPhone ? ` • ${claim.claimantPhone}` : ''}
                    </p>
                  </div>
                </div>

                {/* Submitted Proof */}
                <div>
                  <span className="text-xs uppercase font-semibold text-muted dark:text-slate-400 block mb-1">
                    Submitted Proof of Ownership
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-pre-line">
                    {claim.proofDescription}
                  </p>
                </div>

                {/* Recorded Admin Note (if any) */}
                {claim.adminNote && (
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs text-amber-900 dark:text-amber-200">
                    <strong className="font-semibold block mb-0.5">Staff Decision Note:</strong>
                    <span>{claim.adminNote}</span>
                  </div>
                )}

                {/* Staff Actions */}
                {(claim.status === 'pending' || claim.status === 'approved') && (
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRejectModal(claim)}
                      disabled={Boolean(actionLoadingId)}
                    >
                      Reject Claim
                    </Button>

                    {claim.status === 'pending' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(claim._id)}
                        loading={isProcessing}
                        disabled={Boolean(actionLoadingId)}
                      >
                        Approve Claim
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="pt-6">
              <Pagination
                page={page}
                totalPages={meta.totalPages}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>
      )}

      {/* Reject Claim Modal */}
      {rejectClaimTarget && (
        <Modal
          isOpen={Boolean(rejectClaimTarget)}
          onClose={handleCloseRejectModal}
          title={`Reject Claim #${rejectClaimTarget._id.slice(-6)}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseRejectModal}
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReject}
                loading={isRejecting}
                disabled={isRejecting}
              >
                Confirm Rejection
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
            <p>
              Please enter an administrative rejection reason. An admin note of at least <strong>5 characters</strong> is required and will be recorded in the audit log.
            </p>

            <Textarea
              label="Rejection Note / Reason"
              id="rejection-admin-note"
              name="adminNote"
              value={adminNote}
              onChange={(e) => {
                setAdminNote(e.target.value);
                if (noteError) setNoteError(null);
              }}
              rows={4}
              placeholder="e.g. Serial number mismatch; proof description was insufficient to establish ownership..."
              required
              autoFocus
              disabled={isRejecting}
              error={noteError}
              helperText="Minimum 5 characters required"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
