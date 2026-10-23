import express from 'express';
import {
  createClaim,
  listClaims,
  getClaimById,
  updateClaimStatus,
  deleteClaim
} from '../controllers/claim.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createClaimSchema,
  updateClaimStatusSchema,
  claimIdParamSchema,
  listClaimsQuerySchema
} from '../validators/claim.validator.js';

const router = express.Router();

// 1. Create Claim Request (Public, Section 6.1)
router.post('/', validate(createClaimSchema), createClaim);

// 2. List Claims (Staff only, Section 6.1)
router.get('/', requireAuth, validate(listClaimsQuerySchema, 'query'), listClaims);

// 3. Get Claim Detail (Staff only, Section 6.1)
router.get('/:id', requireAuth, validate(claimIdParamSchema, 'params'), getClaimById);

// 4. Update Claim Status & Workflow (Staff only, Section 6.1)
router.put(
  '/:id',
  requireAuth,
  validate(claimIdParamSchema, 'params'),
  validate(updateClaimStatusSchema),
  updateClaimStatus
);

// 5. Delete Claim Request (Staff only, Section 6.1)
router.delete('/:id', requireAuth, validate(claimIdParamSchema, 'params'), deleteClaim);

export default router;
