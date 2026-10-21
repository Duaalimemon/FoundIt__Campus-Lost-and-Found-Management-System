import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Strict staff authentication guard (Sections 3.2, 8.1, SEC-01)
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token'
    });
  }
};

// Dual-audience middleware for Public+ endpoints (Sections 3.3, 7.4, 8.1, SEC-02)
// 1. No token -> continues as anonymous caller (req.user = null)
// 2. Valid token -> attaches staff identity (req.user = decoded)
// 3. Invalid/expired/tampered token -> returns 401 so client clears sessionStorage
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Anonymous caller: no token provided
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  // 2. Token provided: verify validity
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    // 3. Token is invalid or expired
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token'
    });
  }
};
