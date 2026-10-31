import { apiClient } from './client';

/**
 * Found Items API service module.
 * Maps to Express backend endpoints mounted at /api/found-items.
 */

/**
 * List found items with optional filtering, search, and pagination.
 * @param {Object} [params] - { page, limit, q, category, status, dateFrom, dateTo }
 * @returns {Promise<{ success: boolean, data: Array, meta: { page: number, limit: number, total: number, totalPages: number } }>}
 */
export const getFoundItems = (params) => {
  return apiClient.get('/found-items', { params });
};

/**
 * Fetch a single found item by its MongoDB ObjectId.
 * @param {string} id - 24-character hexadecimal ObjectId
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getFoundItemById = (id) => {
  return apiClient.get(`/found-items/${id}`);
};

/**
 * Create a new found item report (Public endpoint).
 * @param {Object} data - { title, category, description, foundLocation, dateFound, storageLocation, finderName, finderEmail, finderPhone, verificationNotes }
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const createFoundItem = (data) => {
  return apiClient.post('/found-items', data);
};

/**
 * Update an existing found item report (Staff only endpoint).
 * Allowed only while item status is 'available'.
 * @param {string} id - 24-character hexadecimal ObjectId
 * @param {Object} data - Updated report fields
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const updateFoundItem = (id, data) => {
  return apiClient.put(`/found-items/${id}`, data);
};

/**
 * Delete a found item report (Staff only endpoint).
 * @param {string} id - 24-character hexadecimal ObjectId
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteFoundItem = (id) => {
  return apiClient.delete(`/found-items/${id}`);
};

export const foundItemsApi = {
  getFoundItems,
  getFoundItemById,
  createFoundItem,
  updateFoundItem,
  deleteFoundItem
};

export default foundItemsApi;
