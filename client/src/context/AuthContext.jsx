import React, { createContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  apiClient,
  STAFF_TOKEN_KEY,
  LEGACY_STAFF_TOKEN_KEY,
  STUDENT_TOKEN_KEY,
  getStaffToken,
  getStudentToken
} from '../api/client';
import {
  studentLogin as apiStudentLogin,
  studentRegister as apiStudentRegister,
  studentGoogleAuth as apiStudentGoogleAuth,
  getStudentProfile
} from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const location = useLocation();
  const isStaffPath = Boolean(location?.pathname?.startsWith('/staff'));

  // Separate state for staff and student sessions
  const [staffUser, setStaffUser] = useState(null);
  const [staffToken, setStaffToken] = useState(null);
  const [studentUser, setStudentUser] = useState(null);
  const [studentToken, setStudentToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prevent duplicate verification in React StrictMode
  const hasInitialized = useRef(false);

  // 1. Initial token verification on mount for both roles independently
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const storedStaffToken = getStaffToken();
    const storedStudentToken = getStudentToken();

    // If no tokens exist, immediately mark as not loading and unauthenticated
    if (!storedStaffToken && !storedStudentToken) {
      setStaffUser(null);
      setStaffToken(null);
      setStudentUser(null);
      setStudentToken(null);
      setIsLoading(false);
      return;
    }

    const verifyPromises = [];

    // Verify staff token through staff-only endpoint
    if (storedStaffToken) {
      verifyPromises.push(
        apiClient
          .get('/auth/verify-staff', { authRole: 'staff' })
          .then((res) => {
            setStaffUser(res.user || { username: 'admin', role: 'staff' });
            setStaffToken(storedStaffToken);
          })
          .catch(() => {
            sessionStorage.removeItem(STAFF_TOKEN_KEY);
            sessionStorage.removeItem(LEGACY_STAFF_TOKEN_KEY);
            setStaffUser(null);
            setStaffToken(null);
          })
      );
    }

    // Verify student token through getStudentProfile (/api/auth/me)
    if (storedStudentToken) {
      verifyPromises.push(
        getStudentProfile()
          .then((res) => {
            const resolvedUser = res.data?.user || res.user;
            setStudentUser(resolvedUser);
            setStudentToken(storedStudentToken);
          })
          .catch(() => {
            sessionStorage.removeItem(STUDENT_TOKEN_KEY);
            setStudentUser(null);
            setStudentToken(null);
          })
      );
    }

    Promise.allSettled(verifyPromises).finally(() => {
      setIsLoading(false);
    });
  }, []);

  // 2. Synchronize with Axios 401 response interceptor
  useEffect(() => {
    const handleStaffUnauthorized = () => {
      sessionStorage.removeItem(STAFF_TOKEN_KEY);
      sessionStorage.removeItem(LEGACY_STAFF_TOKEN_KEY);
      setStaffUser(null);
      setStaffToken(null);
    };

    const handleStudentUnauthorized = () => {
      sessionStorage.removeItem(STUDENT_TOKEN_KEY);
      setStudentUser(null);
      setStudentToken(null);
    };

    window.addEventListener('foundit:unauthorized', handleStaffUnauthorized);
    window.addEventListener('foundit:student-unauthorized', handleStudentUnauthorized);

    return () => {
      window.removeEventListener('foundit:unauthorized', handleStaffUnauthorized);
      window.removeEventListener('foundit:student-unauthorized', handleStudentUnauthorized);
    };
  }, []);

  // 3. Staff Login handler: authenticates with backend and sets staff reactive state
  const login = useCallback(async (username, password) => {
    try {
      const res = await apiClient.post(
        '/auth/login',
        { username, password },
        { authRole: 'staff' }
      );
      const authToken = res.data?.token || res.token;

      if (!authToken) {
        throw new Error('Authentication response did not contain a valid token');
      }

      // Store staff token in both primary and legacy keys for compatibility
      sessionStorage.setItem(STAFF_TOKEN_KEY, authToken);
      sessionStorage.setItem(LEGACY_STAFF_TOKEN_KEY, authToken);

      // Verify token with backend to obtain authoritative user object
      const verifyRes = await apiClient.get('/auth/verify-staff', { authRole: 'staff' });
      const verifiedUser = verifyRes.user || { username, role: 'staff' };

      setStaffUser(verifiedUser);
      setStaffToken(authToken);

      return { success: true, user: verifiedUser, token: authToken };
    } catch (err) {
      sessionStorage.removeItem(STAFF_TOKEN_KEY);
      sessionStorage.removeItem(LEGACY_STAFF_TOKEN_KEY);
      setStaffUser(null);
      setStaffToken(null);
      throw err;
    }
  }, []);

  // 4. Staff Logout handler
  const staffLogout = useCallback(() => {
    sessionStorage.removeItem(STAFF_TOKEN_KEY);
    sessionStorage.removeItem(LEGACY_STAFF_TOKEN_KEY);
    setStaffUser(null);
    setStaffToken(null);
  }, []);

  // 5. Student Login handler
  const studentLogin = useCallback(async (emailOrCredentials, maybePassword) => {
    try {
      const credentials =
        typeof emailOrCredentials === 'object' && emailOrCredentials !== null
          ? emailOrCredentials
          : { email: emailOrCredentials, password: maybePassword };

      const res = await apiStudentLogin(credentials);
      const authToken = res.data?.token || res.token;
      const returnedUser = res.data?.user || res.user;

      if (!authToken) {
        throw new Error('Authentication response did not contain a valid token');
      }

      sessionStorage.setItem(STUDENT_TOKEN_KEY, authToken);

      // Fetch verified profile from /api/auth/me
      let verifiedUser = returnedUser;
      try {
        const profileRes = await getStudentProfile();
        verifiedUser = profileRes.data?.user || profileRes.user || returnedUser;
      } catch {
        // Fall back to returned user if transient error occurs
      }

      setStudentUser(verifiedUser);
      setStudentToken(authToken);

      return { success: true, user: verifiedUser, token: authToken };
    } catch (err) {
      sessionStorage.removeItem(STUDENT_TOKEN_KEY);
      setStudentUser(null);
      setStudentToken(null);
      throw err;
    }
  }, []);

  // 6. Student Registration handler
  const studentRegister = useCallback(async (dataOrName, maybeEmail, maybePassword) => {
    try {
      const payload =
        typeof dataOrName === 'object' && dataOrName !== null
          ? dataOrName
          : { name: dataOrName, email: maybeEmail, password: maybePassword };

      const res = await apiStudentRegister(payload);
      const authToken = res.data?.token || res.token;
      const returnedUser = res.data?.user || res.user;

      if (!authToken) {
        throw new Error('Registration response did not contain a valid token');
      }

      sessionStorage.setItem(STUDENT_TOKEN_KEY, authToken);

      let verifiedUser = returnedUser;
      try {
        const profileRes = await getStudentProfile();
        verifiedUser = profileRes.data?.user || profileRes.user || returnedUser;
      } catch {
        // Fall back to returned user
      }

      setStudentUser(verifiedUser);
      setStudentToken(authToken);

      return { success: true, user: verifiedUser, token: authToken };
    } catch (err) {
      sessionStorage.removeItem(STUDENT_TOKEN_KEY);
      setStudentUser(null);
      setStudentToken(null);
      throw err;
    }
  }, []);

  // 6b. Student Google Login handler
  const studentGoogleLogin = useCallback(async (credential) => {
    try {
      const res = await apiStudentGoogleAuth(credential);
      const authToken = res.data?.token || res.token;
      const returnedUser = res.data?.user || res.user;

      if (!authToken) {
        throw new Error('Authentication response did not contain a valid token');
      }

      sessionStorage.setItem(STUDENT_TOKEN_KEY, authToken);

      let verifiedUser = returnedUser;
      try {
        const profileRes = await getStudentProfile();
        verifiedUser = profileRes.data?.user || profileRes.user || returnedUser;
      } catch {
        // Fall back to returned user if transient error occurs
      }

      setStudentUser(verifiedUser);
      setStudentToken(authToken);

      return { success: true, user: verifiedUser, token: authToken };
    } catch (err) {
      sessionStorage.removeItem(STUDENT_TOKEN_KEY);
      setStudentUser(null);
      setStudentToken(null);
      throw err;
    }
  }, []);

  // 7. Student Logout handler
  const studentLogout = useCallback(() => {
    sessionStorage.removeItem(STUDENT_TOKEN_KEY);
    setStudentUser(null);
    setStudentToken(null);
  }, []);

  // 8. General/Contextual Logout handler
  const logout = useCallback(
    (role) => {
      if (role === 'staff') {
        staffLogout();
      } else if (role === 'student') {
        studentLogout();
      } else {
        // If on staff path, log out staff
        if (isStaffPath) {
          staffLogout();
        } else if (studentUser && !staffUser) {
          studentLogout();
        } else if (staffUser && !studentUser) {
          staffLogout();
        } else {
          studentLogout();
        }
      }
    },
    [isStaffPath, staffUser, studentUser, staffLogout, studentLogout]
  );

  // Computed role & active context values
  const isStaff = Boolean(staffUser && staffToken);
  const isStudent = Boolean(studentUser && studentToken);

  const activeUser = isStaffPath ? staffUser : (studentUser || staffUser);
  const activeToken = isStaffPath ? staffToken : (studentToken || staffToken);
  const isAuthenticated = Boolean(isStaffPath ? isStaff : (isStudent || isStaff));

  const value = useMemo(
    () => ({
      // Active context fields for existing consumers
      user: activeUser,
      token: activeToken,
      isAuthenticated,
      isLoading,

      // Role flags
      isStaff,
      isStudent,
      isStaffAuthenticated: isStaff,
      isStudentAuthenticated: isStudent,

      // Specific role identities
      staffUser,
      staffToken,
      studentUser,
      studentToken,

      // Staff Auth methods
      login,
      staffLogin: login,
      staffLogout,

      // Student Auth methods
      studentLogin,
      studentRegister,
      studentGoogleLogin,
      studentLogout,

      // General Logout
      logout
    }),
    [
      activeUser,
      activeToken,
      isAuthenticated,
      isLoading,
      isStaff,
      isStudent,
      staffUser,
      staffToken,
      studentUser,
      studentToken,
      login,
      staffLogout,
      studentLogin,
      studentRegister,
      studentGoogleLogin,
      studentLogout,
      logout
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
