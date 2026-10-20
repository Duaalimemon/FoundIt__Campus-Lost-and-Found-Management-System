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
  open: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  resolved: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  // Found
  available: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  claimed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  returned: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
  // Claim
  pending: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  approved: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  rejected: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  completed: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' }
};
