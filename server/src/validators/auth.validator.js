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
