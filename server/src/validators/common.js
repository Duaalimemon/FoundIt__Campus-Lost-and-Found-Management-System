import { z } from 'zod';
import { CAMPUS_TIMEZONE, PHONE_REGEX } from '../constants.js';

// Validates 24-character hexadecimal MongoDB ObjectId
export const objectIdSchema = z
  .string({ required_error: 'ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Helper to determine today's YYYY-MM-DD date in campus timezone (Section 5.3, CS-11)
export const getTodayInCampus = (timeZone = CAMPUS_TIMEZONE) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
};

// Helper to check if a YYYY-MM-DD string is an authentic calendar date (rejects 2026-02-31, etc.)
export const isValidCalendarDate = (dateStr) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
};

// Converts valid YYYY-MM-DD string to midnight UTC Date object
export const parseToMidnightUTC = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

// Date Rule DR-1: Sent as YYYY-MM-DD, must be real date, not later than today in campus time zone
export const dr1DateSchema = z
  .string({ required_error: 'Date is required' })
  .refine(isValidCalendarDate, { message: 'Date must be a valid calendar date in YYYY-MM-DD format' })
  .refine(
    (val) => {
      const today = getTodayInCampus();
      return val <= today;
    },
    { message: 'Date cannot be in the future' }
  )
  .transform((val) => parseToMidnightUTC(val));

// Date Rule DR-2: Date filter for lists (YYYY-MM-DD, real date, no upper/lower limit)
export const dr2DateFilterSchema = z
  .string()
  .refine(isValidCalendarDate, { message: 'Filter date must be a valid calendar date in YYYY-MM-DD format' })
  .optional();

// Common Phone validator (optional, 7-20 chars matching PHONE_REGEX)
export const phoneSchema = z
  .string()
  .trim()
  .refine((val) => !val || PHONE_REGEX.test(val), {
    message: 'Phone number format is invalid'
  })
  .optional()
  .default('');

// Common Email validator
export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(100, 'Email cannot exceed 100 characters')
  .email('Invalid email address');
