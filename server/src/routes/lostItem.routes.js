import express from 'express';
import {
  createLostItem,
  listLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem
} from '../controllers/lostItem.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createLostItemSchema,
  updateLostItemSchema,
  lostItemIdParamSchema,
  listLostItemsQuerySchema
} from '../validators/lostItem.validator.js';

const router = express.Router();

// 1. Create LostItem Report (Public, Section 6.1 CRUD-01)
router.post('/', validate(createLostItemSchema), createLostItem);

// 2. List LostItems (Public+, Section 6.1 CRUD-02)
router.get('/', optionalAuth, validate(listLostItemsQuerySchema), listLostItems);

// 3. Get LostItem Detail (Public+, Section 6.1 CRUD-02)
router.get('/:id', optionalAuth, validate(lostItemIdParamSchema), getLostItemById);

// 4. Update LostItem Report (Staff only, Section 6.1 CRUD-03)
router.put('/:id', requireAuth, validate(updateLostItemSchema), updateLostItem);

// 5. Delete LostItem Report (Staff only, Section 6.1 CRUD-04)
router.delete('/:id', requireAuth, validate(lostItemIdParamSchema), deleteLostItem);

export default router;
