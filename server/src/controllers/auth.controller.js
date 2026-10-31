import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import {
  sendPasswordResetEmail,
  sendGoogleAccountNoticeEmail
} from '../services/email.service.js';

// Pre-computed dummy bcrypt hash to ensure constant-time response against timing attacks
const DUMMY_BCRYPT_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const isUsernameMatch = username === env.ADMIN_USERNAME;
    const targetHash = isUsernameMatch && env.ADMIN_PASSWORD_HASH ? env.ADMIN_PASSWORD_HASH : DUMMY_BCRYPT_HASH;

    // Always run bcrypt comparison to prevent username enumeration via timing attacks
    const isPasswordMatch = await bcrypt.compare(password, targetHash);

    // Fail if username or password does not match, or if staff hash is unconfigured
    if (!isUsernameMatch || !isPasswordMatch || !env.ADMIN_PASSWORD_HASH) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token for staff
    const token = jwt.sign(
      {
        username: env.ADMIN_USERNAME,
        role: 'staff'
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        expiresIn: env.JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/student/register (Gate 8C-C)
export const registerStudent = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const trimmedName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Create student account
    let user;
    try {
      user = await User.create({
        name: trimmedName,
        email: normalizedEmail,
        password: password,
        role: 'student',
        authProvider: 'local'
      });
    } catch (err) {
      // Handle MongoDB duplicate key error E11000 safely without exposing internals
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }
      return next(err);
    }

    // Issue student JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: 'student'
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Student account registered successfully',
      data: {
        token,
        expiresIn: env.JWT_EXPIRES_IN,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          authProvider: user.authProvider,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/student/login (Gate 8C-C)
export const loginStudent = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    // Validate account eligibility for local student password authentication:
    // 1. User must exist
    // 2. User must have role: 'student'
    // 3. User must have authProvider: 'local'
    // 4. User must possess a non-empty passwordHash
    const hasValidLocalHash = Boolean(
      user &&
      user.role === 'student' &&
      user.authProvider === 'local' &&
      user.passwordHash
    );

    // Timing attack mitigation: always execute bcrypt.compare
    const targetHash = hasValidLocalHash ? user.passwordHash : DUMMY_BCRYPT_HASH;
    const isPasswordMatch = await bcrypt.compare(password, targetHash);

    if (!hasValidLocalHash || !isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token for student
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: 'student'
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        expiresIn: env.JWT_EXPIRES_IN,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          authProvider: user.authProvider,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auth/me (Gate 8C-C)
export const getCurrentUser = async (req, res, next) => {
  try {
    // Enforce student role from verified JWT
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student identity required.'
      });
    }

    // Resolve student record from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          authProvider: user.authProvider,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/student/google (Google Sign-In for Students)
export const googleAuthStudent = async (req, res, next) => {
  try {
    const { credential } = req.body;

    // Server-side environment configuration check
    if (!env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Google authentication is not configured on this server'
      });
    }

    let payload;
    try {
      const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google authentication token'
      });
    }

    if (!payload || !payload.sub || !payload.email) {
      return res.status(401).json({
        success: false,
        message: 'Google token did not contain valid identity information'
      });
    }

    // Require verified email address from Google
    if (payload.email_verified !== true) {
      return res.status(403).json({
        success: false,
        message: 'Google account email is not verified. Please verify your email with Google.'
      });
    }

    const googleId = String(payload.sub).trim();
    const normalizedEmail = String(payload.email).toLowerCase().trim();

    // 1. Check if user already exists with this googleId
    let user = await User.findOne({ googleId });

    if (user) {
      // Security guard: Ensure account role is student (never elevate/mutate staff)
      if (user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'Access restricted to student accounts only'
        });
      }
    } else {
      // 2. Check if an account already exists with this verified email address
      const existingEmailUser = await User.findOne({ email: normalizedEmail });

      if (existingEmailUser) {
        // Security guard: Ensure account role is student (never elevate/mutate staff)
        if (existingEmailUser.role !== 'student') {
          return res.status(403).json({
            success: false,
            message: 'Access restricted to student accounts only'
          });
        }

        // Check if existing user is already linked to a DIFFERENT Google identity
        if (existingEmailUser.googleId && existingEmailUser.googleId !== googleId) {
          return res.status(409).json({
            success: false,
            message: 'This account is already linked to a different Google account. Please sign in with your original Google account or email and password.',
            code: 'ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_GOOGLE_ACCOUNT'
          });
        }

        // Safe race-safe account linking:
        // Link verified Google subject to existing student account.
        // Preserves existing _id, passwordHash, and authProvider ('local').
        try {
          user = await User.findOneAndUpdate(
            {
              _id: existingEmailUser._id,
              $or: [
                { googleId: { $exists: false } },
                { googleId: null },
                { googleId: '' }
              ]
            },
            {
              $set: { googleId }
            },
            {
              new: true,
              runValidators: true
            }
          );

          if (!user) {
            // Concurrent race check: re-read account state to determine if it was linked concurrently
            const reloadedUser = await User.findById(existingEmailUser._id);
            if (reloadedUser && reloadedUser.googleId === googleId) {
              user = reloadedUser;
            } else {
              return res.status(409).json({
                success: false,
                message: 'This account is already linked to a different Google account. Please sign in with your original Google account or email and password.',
                code: 'ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_GOOGLE_ACCOUNT'
              });
            }
          }
        } catch (err) {
          if (err.code === 11000) {
            return res.status(409).json({
              success: false,
              message: 'This Google account is already linked to another user account.',
              code: 'ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_GOOGLE_ACCOUNT'
            });
          }
          throw err;
        }
      } else {
        // 3. Create new student account under existing User schema
        const rawName = (payload.name || payload.given_name || 'Student').trim().slice(0, 80);
        const studentName = rawName.length >= 2 ? rawName : `${rawName} Student`;

        try {
          user = await User.create({
            name: studentName,
            email: normalizedEmail,
            googleId,
            role: 'student',
            authProvider: 'google',
            passwordHash: ''
          });
        } catch (err) {
          if (err.code === 11000) {
            return res.status(409).json({
              success: false,
              message: 'An account with this email address or Google identity already exists.',
              code: 'ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL'
            });
          }
          throw err;
        }
      }
    }

    // Issue standard FoundIt student JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: 'student'
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        token,
        expiresIn: env.JWT_EXPIRES_IN,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          authProvider: user.authProvider,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/student/forgot-password
export const forgotPasswordStudent = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Constant generic response to prevent user enumeration
    const genericResponse = {
      success: true,
      message: 'If an account exists with that email address, you will receive password reset instructions shortly.'
    };

    // 1. Look up student account
    const user = await User.findOne({ email: normalizedEmail, role: 'student' }).select(
      '+passwordResetToken +passwordResetExpires +passwordResetLastRequestedAt +passwordHash'
    );

    // If user not found: run dummy hash to normalize timing and return generic response
    if (!user) {
      crypto.createHash('sha256').update(normalizedEmail).digest('hex');
      return res.status(200).json(genericResponse);
    }

    // 2. Cooldown check: prevent email flooding (60 seconds)
    if (user.passwordResetLastRequestedAt) {
      const elapsed = Date.now() - new Date(user.passwordResetLastRequestedAt).getTime();
      if (elapsed < 60 * 1000) {
        return res.status(200).json(genericResponse);
      }
    }

    // 3. Security Decision #6: Google-only accounts must not be converted to local password accounts automatically
    const isGoogleOnly = user.authProvider === 'google' && !user.passwordHash;
    if (isGoogleOnly) {
      user.passwordResetLastRequestedAt = new Date();
      if (typeof user.save === 'function') {
        await user.save();
      }

      try {
        await sendGoogleAccountNoticeEmail(user.email);
      } catch (mailErr) {
        if (env.NODE_ENV === 'production') {
          return res.status(500).json({
            success: false,
            message: 'Password reset service is currently unavailable. Please try again later.'
          });
        }
      }

      return res.status(200).json(genericResponse);
    }

    // 4. Generate cryptographically secure random token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 5. Store SHA-256 hash and 15-minute expiration
    user.passwordResetToken = tokenHash;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    user.passwordResetLastRequestedAt = new Date();

    if (typeof user.save === 'function') {
      await user.save();
    } else {
      await User.findByIdAndUpdate(user._id, {
        passwordResetToken: tokenHash,
        passwordResetExpires: user.passwordResetExpires,
        passwordResetLastRequestedAt: user.passwordResetLastRequestedAt
      });
    }

    // 6. Build reset link and dispatch email
    const resetUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (mailErr) {
      // In production, do not silently report success if delivery failed
      if (env.NODE_ENV === 'production') {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        if (typeof user.save === 'function') {
          await user.save();
        } else {
          await User.findByIdAndUpdate(user._id, {
            passwordResetToken: undefined,
            passwordResetExpires: undefined
          });
        }

        return res.status(500).json({
          success: false,
          message: 'Failed to dispatch password reset email. Please try again later.'
        });
      }
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/student/reset-password
export const resetPasswordStudent = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is required'
      });
    }

    // 1. Hash incoming token with SHA-256 to look up matching hash
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    // 2. Query student account with matching token hash and valid expiration
    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
      role: 'student'
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired. Please request a new link.'
      });
    }

    // 3. Immediately invalidate token (single-use guarantee)
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // 4. Update password
    user.password = password;

    if (typeof user.save === 'function') {
      await user.save();
    } else {
      // Fallback: hash password if save hook not available
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      await User.findByIdAndUpdate(user._id, {
        passwordHash,
        passwordResetToken: undefined,
        passwordResetExpires: undefined
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new password.'
    });
  } catch (error) {
    return next(error);
  }
};
