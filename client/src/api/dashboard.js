import { apiClient } from './client';

/**
 * Dashboard API service module.
 * Maps to Express backend endpoints mounted at /api/dashboard.
 */

/**
 * Fetch dashboard overview and aggregated statistics for lost items, found items, and claims.
 * @returns {Promise<{
 *   success: boolean,
 *   data: {
 *     lost: { total: number, open: number, resolved: number },
 *     found: { total: number, available: number, claimed: number, returned: number },
 *     claims: { total: number, pending: number, approved: number, rejected: number, completed: number },
 *     summary: Object
 *   }
 * }>}
 */
export const getDashboardSummary = () => {
  return apiClient.get('/dashboard/summary');
};

export const dashboardApi = {
  getDashboardSummary
};

export default dashboardApi;
