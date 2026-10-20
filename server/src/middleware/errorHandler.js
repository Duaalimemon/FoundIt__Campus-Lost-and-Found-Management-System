import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  
  // Clean message: don't expose stack or database error internals in production
  let message = err.message || 'Internal server error';
  if (statusCode === 500 && env.NODE_ENV === 'production') {
    message = 'An unexpected server error occurred. Please try again later.';
  }

  const response = {
    success: false,
    message
  };

  if (err.errors && Array.isArray(err.errors)) {
    response.errors = err.errors;
  }

  // Include stack trace only in local development
  if (env.NODE_ENV === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
