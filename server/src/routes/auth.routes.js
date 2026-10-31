import express from 'express';
import {
  login,
  registerStudent,
  loginStudent,
  getCurrentUser,
  googleAuthStudent,
  forgotPasswordStudent,
  resetPasswordStudent
} from '../controllers/auth.controller.js';
import { loginLimiter, passwordResetLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireStaff, optionalAuth } from '../middleware/auth.js';
import {
  loginSchema,
  studentRegisterSchema,
  studentLoginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/auth.validator.js';

const router = express.Router();

// POST /api/auth/login (Section 6.1 Endpoint #2 - Staff Login)
router.post('/login', loginLimiter, validate(loginSchema), login);

// POST /api/auth/student/register (Gate 8C-C Endpoint #1 - Student Registration)
router.post('/student/register', loginLimiter, validate(studentRegisterSchema), registerStudent);

// POST /api/auth/student/login (Gate 8C-C Endpoint #2 - Student Login)
router.post('/student/login', loginLimiter, validate(studentLoginSchema), loginStudent);

// POST /api/auth/student/google (Student Google Sign-In, Phase 1)
router.post('/student/google', loginLimiter, validate(googleAuthSchema), googleAuthStudent);

// POST /api/auth/student/forgot-password (Forgot Password Request)
router.post('/student/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPasswordStudent);

// POST /api/auth/student/reset-password (Password Reset Execution)
router.post('/student/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPasswordStudent);

// GET /api/auth/me (Gate 8C-C Endpoint #3 - Current Student Identity)
router.get('/me', requireAuth, getCurrentUser);

// Verification endpoint for testing staff authentication guards (Phase 4, SEC-01, Gate 8C-A)
router.get('/verify-staff', requireStaff, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Staff access verified',
    user: req.user
  });
});

// Verification endpoint for testing optionalAuth dual-audience behavior (Phase 4, SEC-02, Gate 8C-A)
router.get('/verify-optional', optionalAuth, (req, res) => {
  const isStaff = Boolean(req.user && req.user.role === 'staff');
  res.status(200).json({
    success: true,
    message: isStaff ? 'Authenticated staff view' : 'Anonymous public view',
    isStaff
  });
});

export default router;

