import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  if (!env.MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not defined. Please set MONGODB_URI in server/.env with your MongoDB Atlas connection string.'
    );
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`[FoundIt DB] MongoDB connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[FoundIt DB] MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[FoundIt DB] MongoDB disconnected.');
  } catch (error) {
    console.error(`[FoundIt DB] Error during disconnect: ${error.message}`);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[FoundIt DB] MongoDB connection lost.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[FoundIt DB] MongoDB connection error: ${err.message}`);
});
