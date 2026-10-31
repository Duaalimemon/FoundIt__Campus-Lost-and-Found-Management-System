import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let mockMailHandler = null;

/**
 * Configure or retrieve the active nodemailer transporter.
 */
function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
}

/**
 * Sends a password reset email with the secure time-limited reset link.
 * @param {string} toEmail - Recipient student email
 * @param {string} resetUrl - Complete reset link containing single-use token
 */
export async function sendPasswordResetEmail(toEmail, resetUrl) {
  if (mockMailHandler) {
    return mockMailHandler({ type: 'password_reset', to: toEmail, resetUrl });
  }

  const transporter = getTransporter();

  if (!transporter) {
    if (env.NODE_ENV === 'production') {
      throw new Error('Email delivery service is not configured on this server');
    }
    // Safe development logging (does not log credentials or tokens in production)
    console.log(`[DEV EMAIL SERVICE] Password reset email simulated for: ${toEmail}`);
    return { simulated: true, to: toEmail };
  }

  const subject = 'FoundIt — Password Reset Request';
  const text = `Hello,\n\nA password reset was requested for your FoundIt student account.\n\nClick the link below to reset your password (valid for 15 minutes):\n${resetUrl}\n\nIf you did not request this reset, you can safely ignore this email.\n\n— FoundIt Campus Lost & Found Team`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #1e3a8a;">FoundIt Campus Lost &amp; Found</h2>
      <p>Hello,</p>
      <p>A password reset was requested for your FoundIt student account.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Your Password
        </a>
      </p>
      <p style="color: #64748b; font-size: 13px;">This link will expire in 15 minutes and can only be used once.</p>
      <p style="color: #64748b; font-size: 13px;">If you did not request this reset, you can safely ignore this email.</p>
    </div>
  `;

  return transporter.sendMail({
    from: env.EMAIL_FROM,
    to: toEmail,
    subject,
    text,
    html
  });
}

/**
 * Sends a notice to students with Google-only accounts directing them to Google Sign-In.
 * (Security Decision #6: Never automatically convert Google-only accounts to local password accounts)
 * @param {string} toEmail - Recipient student email
 */
export async function sendGoogleAccountNoticeEmail(toEmail) {
  if (mockMailHandler) {
    return mockMailHandler({ type: 'google_notice', to: toEmail });
  }

  const transporter = getTransporter();

  if (!transporter) {
    if (env.NODE_ENV === 'production') {
      throw new Error('Email delivery service is not configured on this server');
    }
    console.log(`[DEV EMAIL SERVICE] Google notice email simulated for: ${toEmail}`);
    return { simulated: true, to: toEmail };
  }

  const subject = 'FoundIt — Account Sign-In Information';
  const text = `Hello,\n\nWe received a request to reset the password for your FoundIt account (${toEmail}).\n\nYour account is registered using Google Sign-In and does not use a local password.\n\nPlease visit the sign-in page and use "Sign in with Google" to access your account.\n\n— FoundIt Campus Lost & Found Team`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #1e3a8a;">FoundIt Campus Lost &amp; Found</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your FoundIt account (<strong>${toEmail}</strong>).</p>
      <p>Your account is registered using <strong>Google Sign-In</strong> and does not have a separate local password.</p>
      <p>Please visit the sign-in page and click the <strong>"Sign in with Google"</strong> button to access your account.</p>
      <p style="color: #64748b; font-size: 13px;">If you did not request this information, you can safely ignore this email.</p>
    </div>
  `;

  return transporter.sendMail({
    from: env.EMAIL_FROM,
    to: toEmail,
    subject,
    text,
    html
  });
}

/**
 * Test helper: attach mock handler for test assertions without network calls.
 * @param {Function|null} handler
 */
export function setMockMailHandler(handler) {
  mockMailHandler = handler;
}
