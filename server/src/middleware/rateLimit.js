import rateLimit from 'express-rate-limit';

// Helper to create a consistent rate-limit handler that calculates accurate wait time
const createRateLimitHandler = (defaultMsg) => (req, res, next, options) => {
  const retryAfter = res.getHeader('Retry-After') || Math.ceil(options.windowMs / 1000);
  const minutes = Math.ceil(Number(retryAfter) / 60);
  const waitText = minutes > 1 ? `${minutes} minutes` : '1 minute';
  res.status(429).json({
    success: false,
    message: `${defaultMsg} Please try again after ${waitText}.`,
    retryAfter: Number(retryAfter)
  });
};

// Staff login rate limiter (Section 6.1, 8.1, SEC-04)
// Allows up to 5 failed attempts per 15 minutes per IP to prevent brute-force attacks.
// Successful logins and internal 500 errors do NOT consume rate limit attempts.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per window
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) => res.statusCode < 400 || res.statusCode >= 500,
  handler: createRateLimitHandler('Too many login attempts.')
});

// Student login and registration rate limiter (separate pool from staff login)
// Protects student portal endpoints without blocking staff on shared networks.
export const studentLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) => res.statusCode < 400 || res.statusCode >= 500,
  handler: createRateLimitHandler('Too many login attempts.')
});

// Password reset rate limiter
// Allows up to 5 attempts per 15 minutes per IP to prevent spam and enumeration attacks
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) => res.statusCode < 400 || res.statusCode >= 500,
  handler: createRateLimitHandler('Too many password reset requests.')
});
