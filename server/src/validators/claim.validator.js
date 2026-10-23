import { z } from 'zod';
import { CLAIM_STATUSES } from '../constants.js';
import {
  objectIdSchema,
  phoneSchema,
  emailSchema
} from './common.js';

// 1. Create ClaimRequest Schema (Public, POST /api/claims)
// Any client-supplied status or adminNote is stripped/ignored (Section 5.5, 6.1)
export const createClaimSchema = {
  body: z
    .object({
      foundItem: objectIdSchema,
      claimantName: z
        .string({ required_error: 'Claimant name is required' })
        .trim()
        .min(2, 'Claimant name must be at least 2 characters')
        .max(80, 'Claimant name cannot exceed 80 characters'),
      claimantEmail: emailSchema,
      claimantPhone: phoneSchema,
      proofDescription: z
        .string({ required_error: 'Proof description is required' })
        .trim()
        .min(20, 'Proof description must be at least 20 characters')
        .max(1000, 'Proof description cannot exceed 1000 characters')
    })
    .strip()
};

// 2. Update Claim Status Schema (Staff only, PUT /api/claims/:id)
// Requires status; if status is 'rejected', adminNote must be provided and >= 5 characters (Section 5.5)
export const updateClaimStatusSchema = {
  params: z.object({
    id: objectIdSchema
  }),
  body: z
    .object({
      status: z.enum(CLAIM_STATUSES, {
        errorMap: () => ({ message: 'Status must be a valid claim status (pending, approved, rejected, completed)' })
      }),
      adminNote: z
        .string()
        .trim()
        .max(500, 'Admin note cannot exceed 500 characters')
        .optional()
        .default('')
    })
    .strip()
    .refine(
      (data) => {
        if (data.status === 'rejected') {
          return typeof data.adminNote === 'string' && data.adminNote.trim().length >= 5;
        }
        return true;
      },
      {
        message: 'An admin note of at least 5 characters is required when rejecting a claim',
        path: ['adminNote']
      }
    )
};

// 3. ID Param Schema for detail and delete endpoints
export const claimIdParamSchema = {
  params: z.object({
    id: objectIdSchema
  })
};

// 4. List Claims Query Schema (Staff only, GET /api/claims)
export const listClaimsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().int().min(1).max(50, 'Limit cannot exceed 50').default(12),
    status: z.enum(CLAIM_STATUSES, { errorMap: () => ({ message: 'Invalid status filter' }) }).optional(),
    foundItem: objectIdSchema.optional(),
    q: z.string().trim().max(50, 'Search query cannot exceed 50 characters').optional()
  })
};
