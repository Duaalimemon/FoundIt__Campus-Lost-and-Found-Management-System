import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

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
