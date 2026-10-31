import dotenv from 'dotenv';

dotenv.config();

// Startup Guard (Section 9.1 Switch Guards):
// The server must refuse to start if test variables are present outside test mode.
const nodeEnv = process.env.NODE_ENV || 'development';
if (nodeEnv !== 'test') {
  if (process.env.FAIL_WRITE) {
    console.error('FATAL SECURITY GUARD: FAIL_WRITE is defined while NODE_ENV is not "test". Server startup aborted.');
    process.exit(1);
  }
  if (process.env.MONGODB_URI_TEST) {
    console.error('FATAL SECURITY GUARD: MONGODB_URI_TEST is defined while NODE_ENV is not "test". Server startup aborted.');
    process.exit(1);
  }
}

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: nodeEnv,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'FoundIt Campus Lost & Found <no-reply@campus.edu>'
};
