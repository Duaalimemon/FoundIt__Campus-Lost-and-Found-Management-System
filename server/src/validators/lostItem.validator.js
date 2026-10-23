import { z } from 'zod';
import { CATEGORIES, LOST_STATUSES } from '../constants.js';
import {
  objectIdSchema,
  dr1DateSchema,
  dr2DateFilterSchema,
  phoneSchema,
  emailSchema
} from './common.js';

// Base fields shared by create and update (Section 5.2)
const lostItemCoreFields = {
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
  lastSeenLocation: z
    .string({ required_error: 'Last seen location is required' })
    .trim()
    .min(2, 'Last seen location must be at least 2 characters')
    .max(100, 'Last seen location cannot exceed 100 characters'),
  dateLost: dr1DateSchema,
  reporterName: z
    .string({ required_error: 'Reporter name is required' })
    .trim()
    .min(2, 'Reporter name must be at least 2 characters')
    .max(80, 'Reporter name cannot exceed 80 characters'),
  reporterEmail: emailSchema,
  reporterPhone: phoneSchema
};

// 1. Create LostItem Schema (Public, POST /api/lost-items)
// Status is system-set to 'open'; any client-supplied status is stripped/ignored (Section 6.1, LST-02)
export const createLostItemSchema = {
  body: z
    .object({
      ...lostItemCoreFields
    })
    .strip()
};

// 2. Update LostItem Schema (Staff only, PUT /api/lost-items/:id)
// Full editable body including status (open <-> resolved freely per Section 5.2, 5.6)
export const updateLostItemSchema = {
  params: z.object({
    id: objectIdSchema
  }),
  body: z
    .object({
      ...lostItemCoreFields,
      status: z.enum(LOST_STATUSES, {
        errorMap: () => ({ message: 'Status must be open or resolved' })
      })
    })
    .strip()
};

// 3. ID Param Schema for detail and delete endpoints
export const lostItemIdParamSchema = {
  params: z.object({
    id: objectIdSchema
  })
};

// 4. List Query Schema (Section 6.3, DR-2)
export const listLostItemsQuerySchema = {
  query: z
    .object({
      page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
      limit: z.coerce.number().int().min(1).max(50, 'Limit cannot exceed 50').default(12),
      q: z.string().trim().max(50, 'Search query cannot exceed 50 characters').optional(),
      category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Invalid category filter' }) }).optional(),
      status: z.enum(LOST_STATUSES, { errorMap: () => ({ message: 'Invalid status filter' }) }).optional(),
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
