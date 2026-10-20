import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = env.PORT || 5000;

let server;

const startServer = async () => {
  if (env.MONGODB_URI) {
    try {
      await connectDB();
    } catch (err) {
      console.error('[FoundIt API] Failed to connect to database during startup:', err.message);
      process.exit(1);
    }
  } else {
    console.warn(
      '[FoundIt API] WARNING: MONGODB_URI is not set in server/.env. Database features will be unavailable until configured.'
    );
  }

  server = app.listen(PORT, () => {
    console.log(`[FoundIt API] Server is listening on port ${PORT} in ${env.NODE_ENV} mode.`);
    console.log(`[FoundIt API] Allowed client origin: ${env.CLIENT_ORIGIN}`);
  });
};

startServer();

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`[FoundIt API] ${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      console.log('[FoundIt API] Process terminated.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
