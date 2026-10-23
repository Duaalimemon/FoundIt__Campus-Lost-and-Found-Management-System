import express from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Dashboard Summary Endpoints (Section 6.1)
router.get('/', optionalAuth, getDashboardSummary);
router.get('/summary', optionalAuth, getDashboardSummary);
router.get('/stats', optionalAuth, getDashboardSummary);

export default router;
