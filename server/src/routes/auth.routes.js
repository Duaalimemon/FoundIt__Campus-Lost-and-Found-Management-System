import express from 'express';
import { login } from '../controllers/auth.controller.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { loginSchema } from '../validators/auth.validator.js';

const router = express.Router();

// POST /api/auth/login (Section 6.1 Endpoint #2)
router.post('/login', loginLimiter, validate(loginSchema), login);

// Verification endpoint for testing staff authentication guards (Phase 4, SEC-01)
router.get('/verify-staff', requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Staff access verified',
    user: req.user
  });
});

// Verification endpoint for testing optionalAuth dual-audience behavior (Phase 4, SEC-02)
router.get('/verify-optional', optionalAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: req.user ? 'Authenticated staff view' : 'Anonymous public view',
    isStaff: !!req.user
  });
});

export default router;
