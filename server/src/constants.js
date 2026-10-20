// System-wide constants (Sections 5.1, 5.2, 5.4, 5.5, 5.6, 5.10)

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

// Allowed transitions for ClaimRequest (Section 5.6)
export const ALLOWED_CLAIM_TRANSITIONS = {
  pending: ['approved', 'rejected'],
  approved: ['rejected', 'completed'],
  rejected: [],
  completed: []
};

// Single source of truth for public projection (Section 5.10, AD-04)
export const PUBLIC_FIELDS = {
  lostItem: '_id title category description lastSeenLocation dateLost status createdAt',
  foundItem: '_id title category description foundLocation dateFound status createdAt'
};

// Campus timezone for date rule DR-1 (Section 5.3, CS-11)
export const CAMPUS_TIMEZONE = 'Asia/Karachi';

// Phone number regex pattern per Section 5.2 (7-20 chars, digits, +, (), -, spaces)
export const PHONE_REGEX = /^[0-9+()\-\s]{7,20}$/;
