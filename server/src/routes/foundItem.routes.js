import express from 'express';
import {
  createFoundItem,
  listFoundItems,
  getFoundItemById,
  updateFoundItem,
  deleteFoundItem,
  listMyFoundItems
} from '../controllers/foundItem.controller.js';
import { requireStaff, requireStudent, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createFoundItemSchema,
  updateFoundItemSchema,
  foundItemIdParamSchema,
  listFoundItemsQuerySchema
} from '../validators/foundItem.validator.js';

const router = express.Router();

// 1. Create FoundItem Report (Student only, Section 6.1 CRUD-01, Gate 8C-D)
router.post('/', requireStudent, validate(createFoundItemSchema), createFoundItem);

// 2. List Student's Own FoundItems (Student only, Gate 8C-D) - Mounted BEFORE /:id
router.get('/mine', requireStudent, listMyFoundItems);

// 3. List FoundItems (Public+, Section 6.1 CRUD-02)
router.get('/', optionalAuth, validate(listFoundItemsQuerySchema), listFoundItems);

// 4. Get FoundItem Detail (Public+, Section 6.1 CRUD-02)
router.get('/:id', optionalAuth, validate(foundItemIdParamSchema), getFoundItemById);

// 5. Update FoundItem Report (Staff only, Section 6.1 CRUD-03, Gate 8C-A)
router.put('/:id', requireStaff, validate(updateFoundItemSchema), updateFoundItem);

// 6. Delete FoundItem Report (Staff only, Section 6.1 CRUD-04, Gate 8C-A)
router.delete('/:id', requireStaff, validate(foundItemIdParamSchema), deleteFoundItem);

export default router;

