import { apiClient } from './client';

/**
 * Claims API service module.
 * Maps to Express backend endpoints mounted at /api/claims.
 */

/**
 * List claims with optional filtering by status, foundItem, search, and pagination.
 * (Staff only endpoint).
 * @param {Object} [params] - { page, limit, status, foundItem, q }
 * @returns {Promise<{ success: boolean, data: Array, meta: { page: number, limit: number, total: number, totalPages: number } }>}
 */
export const getClaims = (params) => {
  return apiClient.get('/claims', { params });
};

/**
 * Fetch a single claim request by its MongoDB ObjectId.
 * (Staff only endpoint).
 * @param {string} id - 24-character hexadecimal ObjectId
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getClaimById = (id) => {
  return apiClient.get(`/claims/${id}`);
};

/**
 * Submit a new claim request for a found item (Public endpoint).
 * @param {Object} data - { foundItem, claimantName, claimantEmail, claimantPhone, proofDescription }
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const createClaim = (data) => {
  return apiClient.post('/claims', data);
};

/**
 * Update claim status and workflow notes (Staff only endpoint).
 * Allowed transitions: pending -> approved/rejected, approved -> rejected/completed.
 * If status is 'rejected', adminNote must be provided (>= 5 chars).
 * @param {string} id - 24-character hexadecimal ObjectId
 * @param {Object} payload - { status: 'pending'|'approved'|'rejected'|'completed', adminNote?: string }
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const updateClaimStatus = (id, payload) => {
  return apiClient.put(`/claims/${id}`, payload);
};

/**
 * Delete a claim request (Staff only endpoint).
 * @param {string} id - 24-character hexadecimal ObjectId
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteClaim = (id) => {
  return apiClient.delete(`/claims/${id}`);
};

/**
 * Fetch claims submitted by the authenticated student.
 * (Student only endpoint).
 * @returns {Promise<{ success: boolean, data: Array }>}
 */
export const getMyClaims = () => {
  return apiClient.get('/claims/mine');
};

export const claimsApi = {
  getClaims,
  getClaimById,
  getMyClaims,
  createClaim,
  updateClaimStatus,
  deleteClaim
};

export default claimsApi;
