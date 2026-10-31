import { apiClient } from './client';

/**
 * Student Authentication API service module.
 * Maps to Express backend endpoints mounted at /api/auth.
 */

/**
 * Register a new student account.
 * @param {Object} data - { name, email, password }
 * @returns {Promise<{ success: boolean, message: string, data: { token: string, expiresIn: string, user: Object } }>}
 */
export const studentRegister = (data) => {
  return apiClient.post('/auth/student/register', data);
};

/**
 * Log in to an existing student account with email and password.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{ success: boolean, message: string, data: { token: string, expiresIn: string, user: Object } }>}
 */
export const studentLogin = (credentials) => {
  return apiClient.post('/auth/student/login', credentials);
};

/**
 * Fetch the authenticated student's profile.
 * Requires an active student JWT in the Authorization header.
 * @returns {Promise<{ success: boolean, data: { user: Object } }>}
 */
export const getStudentProfile = () => {
  return apiClient.get('/auth/me');
};

/**
 * Authenticate student via Google ID token.
 * Calls backend POST /api/auth/student/google with { credential }.
 * @param {string} credential - Google ID token JWT string
 * @returns {Promise<{ success: boolean, message: string, data: { token: string, expiresIn: string, user: Object } }>}
 */
export const studentGoogleAuth = (credential) => {
  return apiClient.post('/auth/student/google', { credential });
};

/**
 * Request password reset instructions for a student account.
 * Calls backend POST /api/auth/student/forgot-password with { email }.
 * @param {Object} data - { email: string }
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const studentForgotPassword = (data) => {
  return apiClient.post('/auth/student/forgot-password', data);
};

/**
 * Reset student password using a single-use token.
 * Calls backend POST /api/auth/student/reset-password with { token: string, password: string }.
 * @param {Object} data - { token: string, password: string }
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const studentResetPassword = (data) => {
  return apiClient.post('/auth/student/reset-password', data);
};

export const authApi = {
  studentRegister,
  studentLogin,
  studentGoogleAuth,
  getStudentProfile,
  studentForgotPassword,
  studentResetPassword
};

export default authApi;
