import {
  CATEGORIES,
  LOST_STATUSES,
  FOUND_STATUSES,
  CLAIM_STATUSES,
  CAMPUS_TIMEZONE,
  PHONE_REGEX
} from './constants.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validates whether a value is a valid 24-hex-char MongoDB ObjectId string.
 */
export function isValidObjectId(id) {
  if (typeof id !== 'string') return false;
  return OBJECT_ID_REGEX.test(id.trim());
}

/**
 * Validates basic email formatting and length <= 100.
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  return trimmed.length > 0 && trimmed.length <= 100 && EMAIL_REGEX.test(trimmed);
}

/**
 * Validates phone numbers per Section 5.2 (7-20 chars with digits, +, (), -, spaces).
 * Empty string or undefined/null is considered valid for optional phone fields.
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return true;
  const trimmed = phone.trim();
  if (trimmed === '') return true;
  return PHONE_REGEX.test(trimmed);
}

/**
 * Validates whether a date string is in YYYY-MM-DD format and is an authentic calendar date.
 */
export function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/**
 * Gets today's YYYY-MM-DD date string in the campus timezone (Asia/Karachi).
 */
export function getTodayInCampus(timeZone = CAMPUS_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

/**
 * Date Rule DR-1: Checks if date is a valid calendar date not later than today in campus time zone.
 */
export function isNotFutureDate(dateStr, timeZone = CAMPUS_TIMEZONE) {
  if (!isValidCalendarDate(dateStr)) return false;
  const today = getTodayInCampus(timeZone);
  return dateStr <= today;
}

/**
 * Centralized validator for Lost Item reports (create & update).
 */
export function validateLostItem(data = {}, isUpdate = false) {
  const errors = {};

  // Title: 3-100 characters
  const title = (data.title || '').trim();
  if (!title) {
    errors.title = 'Title is required';
  } else if (title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (title.length > 100) {
    errors.title = 'Title cannot exceed 100 characters';
  }

  // Category: must be in CATEGORIES
  if (!data.category) {
    errors.category = 'Category is required';
  } else if (!CATEGORIES.includes(data.category)) {
    errors.category = 'Invalid category';
  }

  // Description: 10-1000 characters
  const description = (data.description || '').trim();
  if (!description) {
    errors.description = 'Description is required';
  } else if (description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (description.length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters';
  }

  // Last Seen Location: 2-100 characters
  const lastSeenLocation = (data.lastSeenLocation || '').trim();
  if (!lastSeenLocation) {
    errors.lastSeenLocation = 'Last seen location is required';
  } else if (lastSeenLocation.length < 2) {
    errors.lastSeenLocation = 'Last seen location must be at least 2 characters';
  } else if (lastSeenLocation.length > 100) {
    errors.lastSeenLocation = 'Last seen location cannot exceed 100 characters';
  }

  // Date Lost: DR-1 calendar date in YYYY-MM-DD not in the future
  const dateLost = (data.dateLost || '').trim();
  if (!dateLost) {
    errors.dateLost = 'Date lost is required';
  } else if (!isValidCalendarDate(dateLost)) {
    errors.dateLost = 'Date must be a valid calendar date in YYYY-MM-DD format';
  } else if (!isNotFutureDate(dateLost)) {
    errors.dateLost = 'Date cannot be in the future';
  }

  // Reporter Name: 2-80 characters
  const reporterName = (data.reporterName || '').trim();
  if (!reporterName) {
    errors.reporterName = 'Reporter name is required';
  } else if (reporterName.length < 2) {
    errors.reporterName = 'Reporter name must be at least 2 characters';
  } else if (reporterName.length > 80) {
    errors.reporterName = 'Reporter name cannot exceed 80 characters';
  }

  // Reporter Email: valid email <= 100 characters
  const reporterEmail = (data.reporterEmail || '').trim();
  if (!reporterEmail) {
    errors.reporterEmail = 'Reporter email is required';
  } else if (!isValidEmail(reporterEmail)) {
    errors.reporterEmail = 'Invalid email address';
  }

  // Reporter Phone: optional, 7-20 characters if provided
  if (data.reporterPhone && !isValidPhone(data.reporterPhone)) {
    errors.reporterPhone = 'Phone number format is invalid';
  }

  // Status: only validated on update
  if (isUpdate && data.status && !LOST_STATUSES.includes(data.status)) {
    errors.status = 'Status must be open or resolved';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Centralized validator for Found Item reports (create & update).
 */
export function validateFoundItem(data = {}, isUpdate = false) {
  const errors = {};

  // Title: 3-100 characters
  const title = (data.title || '').trim();
  if (!title) {
    errors.title = 'Title is required';
  } else if (title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (title.length > 100) {
    errors.title = 'Title cannot exceed 100 characters';
  }

  // Category: must be in CATEGORIES
  if (!data.category) {
    errors.category = 'Category is required';
  } else if (!CATEGORIES.includes(data.category)) {
    errors.category = 'Invalid category';
  }

  // Description: 10-1000 characters
  const description = (data.description || '').trim();
  if (!description) {
    errors.description = 'Description is required';
  } else if (description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (description.length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters';
  }

  // Found Location: 2-100 characters
  const foundLocation = (data.foundLocation || '').trim();
  if (!foundLocation) {
    errors.foundLocation = 'Found location is required';
  } else if (foundLocation.length < 2) {
    errors.foundLocation = 'Found location must be at least 2 characters';
  } else if (foundLocation.length > 100) {
    errors.foundLocation = 'Found location cannot exceed 100 characters';
  }

  // Date Found: DR-1 calendar date in YYYY-MM-DD not in the future
  const dateFound = (data.dateFound || '').trim();
  if (!dateFound) {
    errors.dateFound = 'Date found is required';
  } else if (!isValidCalendarDate(dateFound)) {
    errors.dateFound = 'Date must be a valid calendar date in YYYY-MM-DD format';
  } else if (!isNotFutureDate(dateFound)) {
    errors.dateFound = 'Date cannot be in the future';
  }

  // Storage Location: 2-100 characters
  const storageLocation = (data.storageLocation || '').trim();
  if (!storageLocation) {
    errors.storageLocation = 'Storage location is required';
  } else if (storageLocation.length < 2) {
    errors.storageLocation = 'Storage location must be at least 2 characters';
  } else if (storageLocation.length > 100) {
    errors.storageLocation = 'Storage location cannot exceed 100 characters';
  }

  // Finder Name: 2-80 characters
  const finderName = (data.finderName || '').trim();
  if (!finderName) {
    errors.finderName = 'Finder name is required';
  } else if (finderName.length < 2) {
    errors.finderName = 'Finder name must be at least 2 characters';
  } else if (finderName.length > 80) {
    errors.finderName = 'Finder name cannot exceed 80 characters';
  }

  // Finder Email: valid email <= 100 characters
  const finderEmail = (data.finderEmail || '').trim();
  if (!finderEmail) {
    errors.finderEmail = 'Finder email is required';
  } else if (!isValidEmail(finderEmail)) {
    errors.finderEmail = 'Invalid email address';
  }

  // Finder Phone: optional, 7-20 characters if provided
  if (data.finderPhone && !isValidPhone(data.finderPhone)) {
    errors.finderPhone = 'Phone number format is invalid';
  }

  // Verification Notes: optional, max 500 characters
  if (data.verificationNotes && data.verificationNotes.length > 500) {
    errors.verificationNotes = 'Verification notes cannot exceed 500 characters';
  }

  // Status: only validated on update if provided
  if (isUpdate && data.status && !FOUND_STATUSES.includes(data.status)) {
    errors.status = 'Invalid found status';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Centralized validator for public Claim creation.
 */
export function validateClaim(data = {}) {
  const errors = {};

  // Found Item ID: required valid MongoDB ObjectId
  if (!data.foundItem) {
    errors.foundItem = 'Target item ID is required';
  } else if (!isValidObjectId(data.foundItem)) {
    errors.foundItem = 'Invalid item ID format';
  }

  // Claimant Name: 2-80 characters
  const claimantName = (data.claimantName || '').trim();
  if (!claimantName) {
    errors.claimantName = 'Claimant name is required';
  } else if (claimantName.length < 2) {
    errors.claimantName = 'Claimant name must be at least 2 characters';
  } else if (claimantName.length > 80) {
    errors.claimantName = 'Claimant name cannot exceed 80 characters';
  }

  // Claimant Email: valid email <= 100 characters
  const claimantEmail = (data.claimantEmail || '').trim();
  if (!claimantEmail) {
    errors.claimantEmail = 'Claimant email is required';
  } else if (!isValidEmail(claimantEmail)) {
    errors.claimantEmail = 'Invalid email address';
  }

  // Claimant Phone: optional, 7-20 characters if provided
  if (data.claimantPhone && !isValidPhone(data.claimantPhone)) {
    errors.claimantPhone = 'Phone number format is invalid';
  }

  // Proof Description: 20-1000 characters
  const proofDescription = (data.proofDescription || '').trim();
  if (!proofDescription) {
    errors.proofDescription = 'Proof description is required';
  } else if (proofDescription.length < 20) {
    errors.proofDescription = 'Proof description must be at least 20 characters';
  } else if (proofDescription.length > 1000) {
    errors.proofDescription = 'Proof description cannot exceed 1000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Centralized validator for staff claim status updates (workflow transitions).
 */
export function validateClaimStatusUpdate(data = {}) {
  const errors = {};

  // Status: must be in CLAIM_STATUSES
  if (!data.status) {
    errors.status = 'Status is required';
  } else if (!CLAIM_STATUSES.includes(data.status)) {
    errors.status = 'Invalid claim status';
  }

  // Admin Note: max 500 chars; if rejected, min 5 chars required (Section 5.5)
  const adminNote = (data.adminNote || '').trim();
  if (adminNote.length > 500) {
    errors.adminNote = 'Admin note cannot exceed 500 characters';
  } else if (data.status === 'rejected' && adminNote.length < 5) {
    errors.adminNote = 'An admin note of at least 5 characters is required when rejecting a claim';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
