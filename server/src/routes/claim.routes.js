import express from 'express';
import {
  createClaim,
  listClaims,
  getClaimById,
  updateClaimStatus,
  deleteClaim,
  listMyClaims
} from '../controllers/claim.controller.js';
import { requireStaff, requireStudent } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createClaimSchema,
  updateClaimStatusSchema,
  claimIdParamSchema,
  listClaimsQuerySchema
} from '../validators/claim.validator.js';

const router = express.Router();

// 1. Create Claim Request (Student only, Section 6.1, Gate 8C-D)
router.post('/', requireStudent, validate(createClaimSchema), createClaim);

// 2. List Student's Own Claims (Student only, Gate 8C-D) - Mounted BEFORE /:id
router.get('/mine', requireStudent, listMyClaims);

// 3. List Claims (Staff only, Section 6.1, Gate 8C-A)
router.get('/', requireStaff, validate(listClaimsQuerySchema, 'query'), listClaims);

// 4. Get Claim Detail (Staff only, Section 6.1, Gate 8C-A)
router.get('/:id', requireStaff, validate(claimIdParamSchema, 'params'), getClaimById);

// 5. Update Claim Status & Workflow (Staff only, Section 6.1, Gate 8C-A)
router.put(
  '/:id',
  requireStaff,
  validate(claimIdParamSchema, 'params'),
  validate(updateClaimStatusSchema),
  updateClaimStatus
);

// 6. Delete Claim Request (Staff only, Section 6.1, Gate 8C-A)
router.delete('/:id', requireStaff, validate(claimIdParamSchema, 'params'), deleteClaim);

export default router;

