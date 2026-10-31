
import mongoose from 'mongoose';
import { env } from './env.js';

const FOUND_IT_DATABASE = 'founditDB';

const STANDARD_HOSTS = [
  'ac-w990br1-shard-00-00.splupdq.mongodb.net:27017',
  'ac-w990br1-shard-00-01.splupdq.mongodb.net:27017',
  'ac-w990br1-shard-00-02.splupdq.mongodb.net:27017',
];

const buildConnectionUri = (originalUri) => {
  if (!originalUri) {
    throw new Error(
      'MONGODB_URI is not defined. Please set MONGODB_URI in server/.env.'
    );
  }

  // Already-standard MongoDB URI: preserve it.
  if (originalUri.startsWith('mongodb://')) {
    return originalUri;
  }

  // Convert the known Atlas SRV URI to a standard URI.
  const match = originalUri.match(
    /^mongodb\+srv:\/\/([^/]+)(\/[^?]*)?(\?.*)?$/
  );

  if (!match) {
    throw new Error('The MongoDB connection URI has an unsupported format.');
  }

  const authority = match[1];
  const atIndex = authority.lastIndexOf('@');

  if (atIndex < 0) {
    throw new Error('MongoDB credentials are missing from the connection URI.');
  }

  const credentials = authority.slice(0, atIndex);
  const hostname = authority.slice(atIndex + 1);

  if (hostname !== 'cluster0.splupdq.mongodb.net') {
    throw new Error(
      'The MongoDB cluster hostname does not match the configured FoundIt cluster.'
    );
  }

  const options = new URLSearchParams(
    (match[3] || '').replace(/^\?/, '')
  );

  options.set('replicaSet', 'atlas-bvoyim-shard-0');
  options.set('authSource', 'admin');
  options.set('tls', 'true');

  const queryString = options.toString();

  return (
    `mongodb://${credentials}@${STANDARD_HOSTS.join(',')}` +
    `/${FOUND_IT_DATABASE}?${queryString}`
  );
};

export const connectDB = async () => {
  const connectionUri = buildConnectionUri(env.MONGODB_URI);

  try {
    const conn = await mongoose.connect(connectionUri);

    console.log(
      `[FoundIt DB] MongoDB connected: ${conn.connection.host} / Database: ${conn.connection.name}`
    );

    return conn;
  } catch (error) {
    console.error(
      `[FoundIt DB] MongoDB connection failed: ${error.message}`
    );

    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[FoundIt DB] MongoDB disconnected.');
  } catch (error) {
    console.error(
      `[FoundIt DB] Error during disconnect: ${error.message}`
    );
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[FoundIt DB] MongoDB connection lost.');
});

mongoose.connection.on('error', (error) => {
  console.error(
    `[FoundIt DB] MongoDB connection error: ${error.message}`
  );
});
