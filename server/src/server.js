import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[FoundIt API] Server is listening on port ${PORT} in ${env.NODE_ENV} mode.`);
  console.log(`[FoundIt API] Allowed client origin: ${env.CLIENT_ORIGIN}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[FoundIt API] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[FoundIt API] Process terminated.');
  });
});
