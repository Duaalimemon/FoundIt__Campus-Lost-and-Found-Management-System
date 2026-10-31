import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    username: z
      .string({ required_error: 'Username is required' })
      .trim()
      .min(1, 'Username cannot be empty'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty')
  })
};

// Student Registration Schema (Gate 8C-C)
export const studentRegisterSchema = {
  body: z
    .object({
      name: z
        .string({ required_error: 'Name is required' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(80, 'Name cannot exceed 80 characters'),
      email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .email('Email format is invalid')
        .max(100, 'Email cannot exceed 100 characters'),
      password: z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password cannot exceed 128 characters')
    })
    .strict()
};

// Student Login Schema (Gate 8C-C)
export const studentLoginSchema = {
  body: z
    .object({
      email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .min(1, 'Email cannot be empty'),
      password: z
        .string({ required_error: 'Password is required' })
        .min(1, 'Password cannot be empty')
    })
    .strict()
};

// Student Google Sign-In Schema (Phase 1)
export const googleAuthSchema = {
  body: z
    .object({
      credential: z
        .string({ required_error: 'Google credential token is required' })
        .trim()
        .min(1, 'Google credential token cannot be empty')
    })
    .strict()
};

// Student Forgot Password Schema
export const forgotPasswordSchema = {
  body: z
    .object({
      email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .email('Email format is invalid')
        .max(100, 'Email cannot exceed 100 characters')
    })
    .strict()
};

// Student Reset Password Schema
export const resetPasswordSchema = {
  body: z
    .object({
      token: z
        .string({ required_error: 'Password reset token is required' })
        .trim()
        .min(1, 'Password reset token cannot be empty'),
      password: z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password cannot exceed 128 characters')
    })
    .strict()
};
