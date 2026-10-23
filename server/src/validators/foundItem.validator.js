import { z } from 'zod';
import { CATEGORIES, FOUND_STATUSES } from '../constants.js';
import {
  objectIdSchema,
  dr1DateSchema,
  dr2DateFilterSchema,
  phoneSchema,
  emailSchema
} from './common.js';

// Base fields for FoundItem (Section 5.2, 5.4)
const foundItemCoreFields = {
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: 'Invalid category' })
  }),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
  foundLocation: z
    .string({ required_error: 'Found location is required' })
    .trim()
    .min(2, 'Found location must be at least 2 characters')
    .max(100, 'Found location cannot exceed 100 characters'),
  dateFound: dr1DateSchema,
  storageLocation: z
    .string({ required_error: 'Storage location is required' })
    .trim()
    .min(2, 'Storage location must be at least 2 characters')
    .max(100, 'Storage location cannot exceed 100 characters'),
  finderName: z
    .string({ required_error: 'Finder name is required' })
    .trim()
    .min(2, 'Finder name must be at least 2 characters')
    .max(80, 'Finder name cannot exceed 80 characters'),
  finderEmail: emailSchema,
  finderPhone: phoneSchema,
  verificationNotes: z
    .string()
    .trim()
    .max(500, 'Verification notes cannot exceed 500 characters')
    .optional()
    .default('')
};

// 1. Create FoundItem Schema (Public, POST /api/found-items)
// Status is system-set to 'available'; any client-supplied status is stripped/ignored (Section 6.1, FND-02)
export const createFoundItemSchema = {
  body: z
    .object({
      ...foundItemCoreFields
    })
    .strip()
};

// 2. Update FoundItem Schema (Staff only, PUT /api/found-items/:id)
// Editing allowed only while status is 'available'; status cannot be modified via PUT
export const updateFoundItemSchema = {
  params: z.object({
    id: objectIdSchema
  }),
  body: z
    .object({
      ...foundItemCoreFields,
      status: z
        .enum(FOUND_STATUSES, {
          errorMap: () => ({ message: 'Invalid found status' })
        })
        .optional()
    })
    .strip()
};

// 3. ID Param Schema for detail and delete endpoints
export const foundItemIdParamSchema = {
  params: z.object({
    id: objectIdSchema
  })
};

// 4. List Query Schema (Section 6.3, DR-2)
export const listFoundItemsQuerySchema = {
  query: z
    .object({
      page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
      limit: z.coerce.number().int().min(1).max(50, 'Limit cannot exceed 50').default(12),
      q: z.string().trim().max(50, 'Search query cannot exceed 50 characters').optional(),
      category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Invalid category filter' }) }).optional(),
      status: z.enum(FOUND_STATUSES, { errorMap: () => ({ message: 'Invalid status filter' }) }).optional(),
      dateFrom: dr2DateFilterSchema,
      dateTo: dr2DateFilterSchema
    })
    .refine(
      (data) => {
        if (data.dateFrom && data.dateTo) {
          return data.dateFrom <= data.dateTo;
        }
        return true;
      },
      {
        message: 'dateFrom cannot be later than dateTo',
        path: ['dateFrom']
      }
    )
};
