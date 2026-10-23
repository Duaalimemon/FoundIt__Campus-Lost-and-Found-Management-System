import express from 'express';
import {
  createFoundItem,
  listFoundItems,
  getFoundItemById,
  updateFoundItem,
  deleteFoundItem
} from '../controllers/foundItem.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createFoundItemSchema,
  updateFoundItemSchema,
  foundItemIdParamSchema,
  listFoundItemsQuerySchema
} from '../validators/foundItem.validator.js';

const router = express.Router();

// 1. Create FoundItem Report (Public, Section 6.1 CRUD-01)
router.post('/', validate(createFoundItemSchema), createFoundItem);

// 2. List FoundItems (Public+, Section 6.1 CRUD-02)
router.get('/', optionalAuth, validate(listFoundItemsQuerySchema), listFoundItems);

// 3. Get FoundItem Detail (Public+, Section 6.1 CRUD-02)
router.get('/:id', optionalAuth, validate(foundItemIdParamSchema), getFoundItemById);

// 4. Update FoundItem Report (Staff only, Section 6.1 CRUD-03)
router.put('/:id', requireAuth, validate(updateFoundItemSchema), updateFoundItem);

// 5. Delete FoundItem Report (Staff only, Section 6.1 CRUD-04)
router.delete('/:id', requireAuth, validate(foundItemIdParamSchema), deleteFoundItem);

export default router;
