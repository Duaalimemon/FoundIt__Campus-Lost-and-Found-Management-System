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
import { createLostItem } from '../api/lostItems';
import { useAuth } from '../hooks/useAuth';

export default function ReportLostPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isStudent, studentUser } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    lastSeenLocation: '',
    dateLost: '',
    reporterName: studentUser?.name || '',
    reporterEmail: studentUser?.email || '',
    reporterPhone: ''
  });

  const [submittedFeedback, setSubmittedFeedback] = useState(false);
  const [createdItemId, setCreatedItemId] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill student contact details when authenticated
  useEffect(() => {
    if (studentUser) {
      setFormData((prev) => ({
        ...prev,
        reporterName: prev.reporterName || studentUser.name || '',
        reporterEmail: prev.reporterEmail || studentUser.email || ''
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
      setError('You must be signed in with a student account to submit a lost item report.');
      return;
    }

    setError(null);
    setCreatedItemId(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        lastSeenLocation: formData.lastSeenLocation.trim(),
        dateLost: formData.dateLost,
        reporterName: formData.reporterName.trim(),
        reporterEmail: formData.reporterEmail.trim(),
        reporterPhone: formData.reporterPhone ? formData.reporterPhone.trim() : ''
      };

      const res = await createLostItem(payload);
      const newId = res?.data?._id || res?._id || null;
      setCreatedItemId(newId);
      setSubmittedFeedback(true);
      setShowSuccessPopup(true);

      // Auto-scroll to top of current page only after successful submission
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

      // Reset form on success
      setFormData({
        title: '',
        category: '',
        description: '',
        lastSeenLocation: '',
        dateLost: '',
        reporterName: studentUser?.name || '',
        reporterEmail: studentUser?.email || '',
        reporterPhone: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please check the details and try again.');
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
        title="Lost Item Report Submitted!"
        message="Your lost item report has been submitted to the campus directory."
      />

      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Lost Items', to: '/lost' },
          { label: 'Report Lost' }
        ]}
      />

      <div className="mb-6 pb-4 border-b border-border dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Report a Lost Item
        </h1>
        <p className="text-sm text-muted dark:text-slate-400 mt-1">
          Provide as much detail as possible to help campus security and community members identify your item.
        </p>
      </div>

      {/* Unauthenticated Student Callout */}
      {!isStudent && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-sm text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <strong className="block font-semibold">Student Sign In Required</strong>
            <span>You must be logged in with a campus student account to file a lost item report.</span>
          </div>
          <Link
            to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-primary hover:bg-blue-900 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Sign In to Report
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

      {submittedFeedback ? (
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-8 sm:p-10 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Your Report Has Been Submitted!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto mb-8">
            Campus security and staff will review your report. If a matching item is turned in, you will be notified.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-8 text-left">
            <Link
              to="/lost"
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors group flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-primary dark:text-blue-400 uppercase tracking-wider block mb-1">
                  Directory
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-blue-400">
                  View in Lost Directory &rarr;
                </span>
                <p className="text-xs text-muted dark:text-slate-400 mt-1">
                  Browse all active lost item reports on campus.
                </p>
              </div>
            </Link>

            {createdItemId ? (
              <Link
                to={`/lost/${createdItemId}`}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors group flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                    Your Report
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-blue-400">
                    View Report Details &rarr;
                  </span>
                  <p className="text-xs text-muted dark:text-slate-400 mt-1">
                    Inspect the details and status of this report.
                  </p>
                </div>
              </Link>
            ) : null}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setSubmittedFeedback(false);
                setCreatedItemId(null);
                setShowSuccessPopup(false);
              }}
            >
              Report Another Item
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-xl border border-border dark:border-slate-800 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Item Details</h2>
          <p className="text-xs text-muted dark:text-slate-400">Publicly visible attributes to identify the item.</p>
        </div>

        <Input
          label="Item Title"
          id="lost-title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Blue Hydroflask Water Bottle, HP Laptop Charger"
          helperText="3 to 100 characters"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            id="lost-category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={CATEGORIES}
            placeholder="Select a category"
            required
          />

          <Input
            label="Date Lost"
            id="lost-date"
            name="dateLost"
            type="date"
            value={formData.dateLost}
            onChange={handleChange}
            helperText="Date Rule DR-1: Cannot be in the future"
            required
          />
        </div>

        <Input
          label="Last Seen Location"
          id="lost-location"
          name="lastSeenLocation"
          value={formData.lastSeenLocation}
          onChange={handleChange}
          placeholder="e.g. Science Block B, Room 204 or Student Center Lounge"
          helperText="Campus location where the item was last noticed"
          required
        />

        <Textarea
          label="Detailed Description"
          id="lost-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Include distinguishing marks, brand, stickers, scratches, or contents..."
          helperText="10 to 1000 characters"
          maxLength={1000}
          showCount
          required
        />

        <div className="border-b border-slate-100 dark:border-slate-800 pt-4 pb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Reporter Contact Information</h2>
          <p className="text-xs text-muted dark:text-slate-400">
            Protected under campus privacy rules. Kept strictly confidential and never displayed on public listings.
          </p>
        </div>

        <Input
          label="Full Name"
          id="reporter-name"
          name="reporterName"
          value={formData.reporterName}
          onChange={handleChange}
          placeholder="Your full name"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Campus Email Address"
            id="reporter-email"
            name="reporterEmail"
            type="email"
            value={formData.reporterEmail}
            onChange={handleChange}
            placeholder="student@university.edu"
            helperText="Used by staff to contact you when found"
            required
          />

          <Input
            label="Phone Number (Optional)"
            id="reporter-phone"
            name="reporterPhone"
            type="tel"
            value={formData.reporterPhone}
            onChange={handleChange}
            placeholder="+92 300 1234567"
            helperText="Optional, 7-20 digits and symbols"
          />
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Link to="/lost">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Submit Lost Report
          </Button>
        </div>
      </form>
      )}
    </div>
  );
}
