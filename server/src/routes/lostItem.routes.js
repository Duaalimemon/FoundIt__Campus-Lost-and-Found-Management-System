import express from 'express';
import {
  createLostItem,
  listLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem,
  listMyLostItems
} from '../controllers/lostItem.controller.js';
import { requireStaff, requireStudent, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createLostItemSchema,
  updateLostItemSchema,
  lostItemIdParamSchema,
  listLostItemsQuerySchema
} from '../validators/lostItem.validator.js';

const router = express.Router();

// 1. Create LostItem Report (Student only, Section 6.1 CRUD-01, Gate 8C-D)
router.post('/', requireStudent, validate(createLostItemSchema), createLostItem);

// 2. List Student's Own LostItems (Student only, Gate 8C-D) - Mounted BEFORE /:id
router.get('/mine', requireStudent, listMyLostItems);

// 3. List LostItems (Public+, Section 6.1 CRUD-02)
router.get('/', optionalAuth, validate(listLostItemsQuerySchema), listLostItems);

// 4. Get LostItem Detail (Public+, Section 6.1 CRUD-02)
router.get('/:id', optionalAuth, validate(lostItemIdParamSchema), getLostItemById);

// 5. Update LostItem Report (Staff only, Section 6.1 CRUD-03, Gate 8C-A)
router.put('/:id', requireStaff, validate(updateLostItemSchema), updateLostItem);

// 6. Delete LostItem Report (Staff only, Section 6.1 CRUD-04, Gate 8C-A)
router.delete('/:id', requireStaff, validate(lostItemIdParamSchema), deleteLostItem);

export default router;

