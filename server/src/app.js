import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/AppError.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration (Section 3.3, 8.1, SEC-08)
// Strictly allows only configured origin(s) in CLIENT_ORIGIN
const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim().replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server) where origin is undefined
    if (!origin) {
      return callback(null, true);
    }
    const cleanOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    return callback(new AppError(`Origin '${origin}' is not permitted by CORS policy.`, 403));
  },
  credentials: true
}));

// Body parsing with size limiting
app.use(express.json({ limit: '10kb' }));

// Health check endpoint (Section 6.1, Phase 2 walking skeleton)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FoundIt API is running healthy',
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler for unmatched routes
app.use(notFound);

// Central error handler
app.use(errorHandler);

export default app;
