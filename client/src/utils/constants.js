// Client constants mirrored from server (Sections 5.1, 5.2, 5.4, 5.5, 7.1)

export const CATEGORIES = [
  'ID Card',
  'Book',
  'Wallet',
  'Keys',
  'Electronics',
  'Bag',
  'Clothing',
  'Other'
];

export const LOST_STATUSES = ['open', 'resolved'];
export const FOUND_STATUSES = ['available', 'claimed', 'returned'];
export const CLAIM_STATUSES = ['pending', 'approved', 'rejected', 'completed'];

export const STATUS_COLORS = {
  // Lost
  open: { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' },
  resolved: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
  // Found
  available: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
  claimed: { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-800' },
  returned: { bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-800 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-800' },
  // Claim
  pending: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-300 dark:border-slate-700' },
  approved: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
  rejected: { bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-800' },
  completed: { bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-800 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-800' }
};

// Campus timezone for date rule DR-1 (Section 5.3, CS-11)
export const CAMPUS_TIMEZONE = 'Asia/Karachi';

// Phone number regex pattern per Section 5.2 (7-20 chars, digits, +, (), -, spaces)
export const PHONE_REGEX = /^[0-9+()\-\s]{7,20}$/;
