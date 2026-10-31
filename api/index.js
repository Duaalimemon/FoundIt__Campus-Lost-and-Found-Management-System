import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

/**
 * Vercel Serverless Function entry point.
 * Ensures the MongoDB database connection is established / reused
 * before dispatching the incoming HTTP request to Express.
 */
export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('[FoundIt Serverless] Failed to connect to database:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please try again later.'
    });
  }

  return app(req, res);
}

