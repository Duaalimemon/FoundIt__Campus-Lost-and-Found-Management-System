import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import ErrorAlert from '../components/common/ErrorAlert';
import Breadcrumbs from '../components/common/Breadcrumbs';
import SuccessPopup from '../components/common/SuccessPopup';
import { CATEGORIES } from '../utils/constants';
import { createFoundItem } from '../api/foundItems';
import { useAuth } from '../hooks/useAuth';

export default function ReportFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isStudent, studentUser } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    foundLocation: '',
    dateFound: '',
    storageLocation: 'Campus Security Office, Student Center Room 101',
    finderName: studentUser?.name || '',
    finderEmail: studentUser?.email || '',
    finderPhone: '',
    verificationNotes: ''
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
        finderName: prev.finderName || studentUser.name || '',
        finderEmail: prev.finderEmail || studentUser.email || ''
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
      setError('You must be signed in with a student account to register a found item.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        foundLocation: formData.foundLocation.trim(),
        dateFound: formData.dateFound,
        storageLocation: formData.storageLocation.trim(),
        finderName: formData.finderName.trim(),
        finderEmail: formData.finderEmail.trim(),
        finderPhone: formData.finderPhone ? formData.finderPhone.trim() : '',
        verificationNotes: formData.verificationNotes ? formData.verificationNotes.trim() : ''
      };

      await createFoundItem(payload);
      setSubmittedFeedback(true);
      setShowSuccessPopup(true);

      // Auto-scroll to top of current page only after successful submission
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

      // Reset form on success
      setFormData({
        title: '',
        category: '',
        description: '',
        foundLocation: '',
        dateFound: '',
        storageLocation: 'Campus Security Office, Student Center Room 101',
        finderName: studentUser?.name || '',
        finderEmail: studentUser?.email || '',
        finderPhone: '',
        verificationNotes: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to register found item. Please check the details and try again.');
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
        title="Found Item Registered!"
        message="Thank you for turning in a found item. Your report has been saved to the campus directory."
      />

      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Found Items', to: '/found' },
          { label: 'Register Found Item' }
        ]}
      />

      <div className="mb-6 pb-4 border-b border-border dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Register a Found Item
        </h1>
        <p className="text-sm text-muted dark:text-slate-400 mt-1">
          Turn in an item found on campus. Your report helps verify true ownership and reunite the item safely.
        </p>
      </div>

      {/* Unauthenticated Student Callout */}
      {!isStudent && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-sm text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <strong className="block font-semibold">Student Sign In Required</strong>
            <span>You must be logged in with a campus student account to register a found item.</span>
          </div>
          <Link
            to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-primary hover:bg-blue-900 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Sign In to Register Item
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
            <strong className="block font-semibold">Registration Received:</strong>
            Thank you for turning in a found item. Your report has been saved. Please deliver the item to Campus Security (Student Center Room 101) to complete safekeeping.
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

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-xl border border-border dark:border-slate-800 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Found Item Attributes</h2>
          <p className="text-xs text-muted dark:text-slate-400">Publicly visible details to help students recognize their property.</p>
        </div>

        <Input
          label="Item Title"
          id="found-title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Casio Calculator fx-991EX, Brown Leather Wallet"
          helperText="3 to 100 characters"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            id="found-category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={CATEGORIES}
            placeholder="Select a category"
            required
          />

          <Input
            label="Date Found"
            id="found-date"
            name="dateFound"
            type="date"
            value={formData.dateFound}
            onChange={handleChange}
            helperText="Date Rule DR-1: Cannot be in the future"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Found Location"
            id="found-location"
            name="foundLocation"
            value={formData.foundLocation}
            onChange={handleChange}
            placeholder="e.g. Science Block B, Room 102"
            helperText="Campus location where found"
            required
          />

          <Input
            label="Storage Location"
            id="found-storage"
            name="storageLocation"
            value={formData.storageLocation}
            onChange={handleChange}
            placeholder="e.g. Security Office Locker 4"
            helperText="Physical security storage on campus"
            required
          />
        </div>

        <Textarea
          label="Public Description"
          id="found-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="General visual description for public listing..."
          helperText="10 to 1000 characters"
          maxLength={1000}
          showCount
          required
        />

        <div className="border-b border-slate-100 dark:border-slate-800 pt-4 pb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Confidential Verification &amp; Finder Info</h2>
          <p className="text-xs text-muted dark:text-slate-400">
            These fields are protected and only accessible to authorized staff during claim verification.
          </p>
        </div>

        <Textarea
          label="Internal Verification Notes (Confidential)"
          id="found-verification-notes"
          name="verificationNotes"
          value={formData.verificationNotes}
          onChange={handleChange}
          rows={2}
          placeholder="Private details known only to the true owner (e.g. serial numbers, specific wallpaper, hidden sticker)..."
          helperText="Optional, max 500 characters. Never revealed publicly."
          maxLength={500}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Finder Name"
            id="finder-name"
            name="finderName"
            value={formData.finderName}
            onChange={handleChange}
            placeholder="Your name"
            required
          />

          <Input
            label="Finder Email"
            id="finder-email"
            name="finderEmail"
            type="email"
            value={formData.finderEmail}
            onChange={handleChange}
            placeholder="finder@campus.edu"
            required
          />

          <Input
            label="Finder Phone (Optional)"
            id="finder-phone"
            name="finderPhone"
            type="tel"
            value={formData.finderPhone}
            onChange={handleChange}
            placeholder="+92 300 1234567"
          />
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Link to="/found">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Register Found Item
          </Button>
        </div>
      </form>
    </div>
  );
}
