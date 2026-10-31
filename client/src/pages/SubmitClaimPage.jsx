import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import ErrorAlert from '../components/common/ErrorAlert';
import Breadcrumbs from '../components/common/Breadcrumbs';
import SuccessPopup from '../components/common/SuccessPopup';
import { createClaim } from '../api/claims';
import { useAuth } from '../hooks/useAuth';

export default function SubmitClaimPage() {
  const { id } = useParams();
  const location = useLocation();
  const { isStudent, studentUser } = useAuth();

  const [formData, setFormData] = useState({
    foundItem: id || '',
    claimantName: studentUser?.name || '',
    claimantEmail: studentUser?.email || '',
    claimantPhone: '',
    proofDescription: ''
  });

  const [submittedFeedback, setSubmittedFeedback] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill student contact details when authenticated
  useEffect(() => {
    if (studentUser) {
      setFormData((prev) => ({
        ...prev,
        claimantName: prev.claimantName || studentUser.name || '',
        claimantEmail: prev.claimantEmail || studentUser.email || ''
      }));
    }
  }, [studentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!isStudent) {
      setError('You must be signed in with a student account to submit an ownership claim.');
      return;
    }

    if (!formData.foundItem) {
      setError('A target found item reference is required. Please select an item from the Found Items directory.');
      return;
    }

    const trimmedProof = formData.proofDescription.trim();
    if (trimmedProof.length < 20) {
      setError('Proof description must be at least 20 characters long to provide sufficient evidence.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        foundItem: formData.foundItem,
        claimantName: formData.claimantName.trim(),
        claimantEmail: formData.claimantEmail.trim(),
        claimantPhone: formData.claimantPhone ? formData.claimantPhone.trim() : '',
        proofDescription: trimmedProof
      };

      await createClaim(payload);
      setSubmittedFeedback(true);
      setShowSuccessPopup(true);

      // Auto-scroll to top of current page only after successful submission
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

      // Reset form on success
      setFormData({
        foundItem: id || '',
        claimantName: studentUser?.name || '',
        claimantEmail: studentUser?.email || '',
        claimantPhone: '',
        proofDescription: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to submit ownership claim. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Notification Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Ownership Claim Submitted!"
        message="Your ownership claim has been recorded and is awaiting staff review. Campus security will review your proof description."
      />

      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Found Items', to: '/found' },
          { label: 'Claim Ownership' }
        ]}
      />

      <div className="mb-6 pb-4 border-b border-border dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Submit Ownership Claim
        </h1>
        <p className="text-sm text-muted dark:text-slate-400 mt-1">
          Prove ownership by providing specific identifying details only the rightful owner would know.
        </p>
      </div>

      {/* Unauthenticated Student Callout */}
      {!isStudent && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-sm text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <strong className="block font-semibold">Student Sign In Required</strong>
            <span>You must be logged in with a campus student account to file an ownership claim.</span>
          </div>
          <Link
            to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-primary hover:bg-blue-900 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Sign In to Claim
          </Link>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6">
          <ErrorAlert
            message={error}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {submittedFeedback && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-sm text-emerald-900 dark:text-emerald-200 flex items-start justify-between">
          <div>
            <strong className="block font-semibold">Claim Submitted:</strong>
            Your ownership claim has been recorded. Campus security will review your proof description and contact you via your campus email.
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmittedFeedback(false);
              setShowSuccessPopup(false);
            }}
            className="text-xs text-emerald-700 dark:text-emerald-400 underline font-medium ml-3 hover:text-emerald-900 dark:hover:text-emerald-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Target Item Reference Banner */}
      <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-700 dark:text-slate-300">
          <span className="font-semibold block">Target Found Item Reference:</span>
          <span className="font-mono text-primary dark:text-blue-400 font-medium">{formData.foundItem || 'General Campus Claim'}</span>
        </div>
        {id && (
          <Link to={`/found/${id}`} className="text-xs text-primary dark:text-blue-400 hover:underline font-medium">
            View Item Details &rarr;
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-xl border border-border dark:border-slate-800 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Claimant Information</h2>
          <p className="text-xs text-muted dark:text-slate-400">Staff will use these details to contact you regarding claim approval.</p>
        </div>

        <Input
          label="Your Full Name"
          id="claimant-name"
          name="claimantName"
          value={formData.claimantName}
          onChange={handleChange}
          placeholder="e.g. Alice Johnson"
          helperText="2 to 80 characters"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Campus Email Address"
            id="claimant-email"
            name="claimantEmail"
            type="email"
            value={formData.claimantEmail}
            onChange={handleChange}
            placeholder="student@university.edu"
            helperText="Used to verify student identity"
            required
          />

          <Input
            label="Phone Number (Optional)"
            id="claimant-phone"
            name="claimantPhone"
            type="tel"
            value={formData.claimantPhone}
            onChange={handleChange}
            placeholder="+92 312 9876543"
          />
        </div>

        <div className="border-b border-slate-100 dark:border-slate-800 pt-4 pb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Ownership Evidence</h2>
          <p className="text-xs text-muted dark:text-slate-400">
            Describe details not visible in public listings (e.g. lock-screen wallpaper, serial numbers, internal receipts, stickers).
          </p>
        </div>

        <Textarea
          label="Proof Description"
          id="proof-description"
          name="proofDescription"
          value={formData.proofDescription}
          onChange={handleChange}
          rows={5}
          placeholder="Explain why this item belongs to you. Include specific identifying features, exact brand/model numbers, unique scratches, or student ID stickers..."
          helperText="Minimum 20 characters required"
          maxLength={1000}
          showCount
          required
        />

        {/* Claim Invariant Information Callout */}
        <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
          <strong className="font-semibold block mb-1">Claim Review Process (Two-Write Invariant):</strong>
          Once submitted, campus security will review your proof. If approved, the found item status changes from <em>available</em> to <em>claimed</em>. You will then be invited to the security office with photo ID to complete retrieval.
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Link to={id ? `/found/${id}` : '/found'}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Submit Claim
          </Button>
        </div>
      </form>
    </div>
  );
}
