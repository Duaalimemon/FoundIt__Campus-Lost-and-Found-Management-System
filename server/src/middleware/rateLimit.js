import rateLimit from 'express-rate-limit';

// Login rate limiter (Section 6.1, 8.1, SEC-04)
// Allows up to 5 attempts per 15 minutes per IP to prevent brute-force attacks
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.'
    });
  }
});
