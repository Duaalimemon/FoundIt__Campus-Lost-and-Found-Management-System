import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

export const STAFF_TOKEN_KEY = 'foundit_staff_token';
export const LEGACY_STAFF_TOKEN_KEY = 'foundit_token';
export const STUDENT_TOKEN_KEY = 'foundit_student_token';

export const getStaffToken = () => {
  return sessionStorage.getItem(STAFF_TOKEN_KEY) || sessionStorage.getItem(LEGACY_STAFF_TOKEN_KEY);
};

export const getStudentToken = () => {
  return sessionStorage.getItem(STUDENT_TOKEN_KEY);
};

// Request interceptor: attach role-appropriate token (Staff or Student)
apiClient.interceptors.request.use(
  (config) => {
    // If an Authorization header is already explicitly set, respect it
    if (config.headers?.Authorization) {
      return config;
    }

    const staffToken = getStaffToken();
    const studentToken = getStudentToken();

    // 1. Explicit override via config.authRole
    if (config.authRole === 'student') {
      if (studentToken) {
        config.headers.Authorization = `Bearer ${studentToken}`;
        config._usedRole = 'student';
      }
      return config;
    }

    if (config.authRole === 'staff') {
      if (staffToken) {
        config.headers.Authorization = `Bearer ${staffToken}`;
        config._usedRole = 'staff';
      }
      return config;
    }

    // 2. Route & method heuristic
    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();

    // Student endpoints: /auth/student/*, /auth/me, /mine routes, or student creation POSTs
    const isStudentEndpoint =
      url.includes('/auth/student') ||
      url.includes('/auth/me') ||
      url.includes('/mine') ||
      (method === 'post' && (url.startsWith('/lost-items') || url.startsWith('/found-items') || url.startsWith('/claims')));

    // Staff endpoints: /auth/verify-staff, /dashboard, item/claim management
    const isStaffEndpoint =
      url.includes('/auth/verify-staff') ||
      url.includes('/dashboard') ||
      ((method === 'put' || method === 'delete' || method === 'patch') && (url.startsWith('/lost-items') || url.startsWith('/found-items') || url.startsWith('/claims'))) ||
      (method === 'get' && (url === '/claims' || (url.startsWith('/claims/') && !url.includes('/mine'))));

    if (isStudentEndpoint) {
      if (studentToken) {
        config.headers.Authorization = `Bearer ${studentToken}`;
        config._usedRole = 'student';
      }
    } else if (isStaffEndpoint) {
      if (staffToken) {
        config.headers.Authorization = `Bearer ${staffToken}`;
        config._usedRole = 'staff';
      }
    } else {
      // General / public / optionalAuth endpoints: prefer staff token if present, otherwise student token
      if (staffToken) {
        config.headers.Authorization = `Bearer ${staffToken}`;
        config._usedRole = 'staff';
      } else if (studentToken) {
        config.headers.Authorization = `Bearer ${studentToken}`;
        config._usedRole = 'student';
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: format errors and handle 401 token invalidation (Section 3.3, 7.4)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Clear invalid/expired token on 401 and notify auth listeners
      if (error.response.status === 401) {
        const usedRole = error.config?._usedRole;
        if (usedRole === 'student') {
          sessionStorage.removeItem(STUDENT_TOKEN_KEY);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('foundit:student-unauthorized'));
          }
        } else if (usedRole === 'staff') {
          sessionStorage.removeItem(STAFF_TOKEN_KEY);
          sessionStorage.removeItem(LEGACY_STAFF_TOKEN_KEY);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('foundit:unauthorized'));
          }
        } else {
          // If role undetermined, clear both safely
          sessionStorage.removeItem(STAFF_TOKEN_KEY);
          sessionStorage.removeItem(LEGACY_STAFF_TOKEN_KEY);
          sessionStorage.removeItem(STUDENT_TOKEN_KEY);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('foundit:unauthorized'));
            window.dispatchEvent(new CustomEvent('foundit:student-unauthorized'));
          }
        }
      }
      return Promise.reject(error.response.data || {
        success: false,
        message: error.response.statusText || 'Request failed'
      });
    }
    return Promise.reject({
      success: false,
      message: error.message || 'Network error occurred. Please check your connection.'
    });
  }
);
