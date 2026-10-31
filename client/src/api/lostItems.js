import { apiClient } from './client';

/**
 * Lost Items API service module.
 * Maps to Express backend endpoints mounted at /api/lost-items.
 */

/**
 * List lost items with optional filtering, search, and pagination.
 * @param {Object} [params] - { page, limit, q, category, status, dateFrom, dateTo }
 * @returns {Promise<{ success: boolean, data: Array, meta: { page: number, limit: number, total: number, totalPages: number } }>}
 */
export const getLostItems = (params) => {
  return apiClient.get('/lost-items', { params });
};

/**
 * Fetch a single lost item by its MongoDB ObjectId.
 * @param {string} id - 24-character hexadecimal ObjectId
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getLostItemById = (id) => {
  return apiClient.get(`/lost-items/${id}`);
};

/**
 * Create a new lost item report (Public endpoint).
 * @param {Object} data - { title, category, description, lastSeenLocation, dateLost, reporterName, reporterEmail, reporterPhone }
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const createLostItem = (data) => {
  return apiClient.post('/lost-items', data);
};

/**
 * Update an existing lost item report (Staff only endpoint).
 * @param {string} id - 24-character hexadecimal ObjectId
 * @param {Object} data - Updated report fields including status ('open' | 'resolved')
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const updateLostItem = (id, data) => {
  return apiClient.put(`/lost-items/${id}`, data);
};

/**
 * Delete a lost item report (Staff only endpoint).
 * @param {string} id - 24-character hexadecimal ObjectId
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteLostItem = (id) => {
  return apiClient.delete(`/lost-items/${id}`);
};

/**
 * Fetch lost item reports submitted by the authenticated student.
 * (Student only endpoint).
 * @returns {Promise<{ success: boolean, data: Array }>}
 */
export const getMyLostItems = () => {
  return apiClient.get('/lost-items/mine');
};

export const lostItemsApi = {
  getLostItems,
  getLostItemById,
  getMyLostItems,
  createLostItem,
  updateLostItem,
  deleteLostItem
};

export default lostItemsApi;
