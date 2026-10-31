import http from 'http';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import app from '../app.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { setMockMailHandler } from '../services/email.service.js';

async function runAuthTests() {
  console.log('--- RUNNING PHASE 4 AUTHENTICATION & SECURITY TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // Setup test staff credentials in env for test session
  const TEST_PASSWORD = 'ValidStaffPassword123!';
  const salt = await bcrypt.genSalt(10);
  const testHash = await bcrypt.hash(TEST_PASSWORD, salt);
  env.ADMIN_USERNAME = 'testadmin';
  env.ADMIN_PASSWORD_HASH = testHash;
  env.JWT_SECRET = 'test_jwt_secret_key_minimum_32_characters_long_for_security';
  env.JWT_EXPIRES_IN = '1h';
  env.GOOGLE_CLIENT_ID = 'test-mock-google-client-id.apps.googleusercontent.com';

  // In-memory driver for offline testing
  const isDbConnected = mongoose.connection.readyState === 1;
  const userStore = new Map();
  let originalUserMethods = {};

  if (!isDbConnected) {
    originalUserMethods = {
      findOne: User.findOne,
      create: User.create,
      findById: User.findById,
      findOneAndUpdate: User.findOneAndUpdate,
      findByIdAndUpdate: User.findByIdAndUpdate
    };

    User.findOne = (filter) => {
      const executeQuery = async () => {
        if (filter.googleId) {
          for (const u of userStore.values()) {
            if (u.googleId === filter.googleId) return u;
          }
        }
        if (filter.email) {
          const targetEmail = filter.email.toLowerCase().trim();
          for (const u of userStore.values()) {
            if (u.email === targetEmail) {
              if (filter.role && u.role !== filter.role) continue;
              return u;
            }
          }
        }
        if (filter.passwordResetToken) {
          for (const u of userStore.values()) {
            if (u.passwordResetToken === filter.passwordResetToken) {
              if (filter.role && u.role !== filter.role) continue;
              if (filter.passwordResetExpires?.$gt) {
                const exp = u.passwordResetExpires instanceof Date ? u.passwordResetExpires.getTime() : Number(u.passwordResetExpires);
                const gt = filter.passwordResetExpires.$gt instanceof Date ? filter.passwordResetExpires.$gt.getTime() : Number(filter.passwordResetExpires.$gt);
                if (exp <= gt) {
                  return null;
                }
              }
              return u;
            }
          }
        }
        return null;
      };

      const queryObj = {
        select: () => queryObj,
        then: (resolve, reject) => executeQuery().then(resolve, reject),
        catch: (reject) => executeQuery().catch(reject)
      };
      return queryObj;
    };

    User.create = async (docData) => {
      const userDoc = new User(docData);
      const validationErr = userDoc.validateSync();
      if (validationErr) throw validationErr;

      for (const u of userStore.values()) {
        if (u.email === userDoc.email) {
          const err = new Error('E11000 duplicate key error');
          err.code = 11000;
          throw err;
        }
        if (userDoc.googleId && u.googleId === userDoc.googleId) {
          const err = new Error('E11000 duplicate key error');
          err.code = 11000;
          throw err;
        }
      }

      if (userDoc._password) {
        const s = await bcrypt.genSalt(10);
        userDoc.passwordHash = await bcrypt.hash(userDoc._password, s);
        userDoc._password = undefined;
      }

      userDoc._id = new mongoose.Types.ObjectId();
      userDoc.createdAt = new Date();
      userDoc.updatedAt = new Date();

      userDoc.save = async function () {
        if (this._password) {
          const s = await bcrypt.genSalt(10);
          this.passwordHash = await bcrypt.hash(this._password, s);
          this._password = undefined;
        }
        this.updatedAt = new Date();
        userStore.set(this._id.toString(), this);
        return this;
      };

      userStore.set(userDoc._id.toString(), userDoc);
      return userDoc;
    };

    User.findById = async (id) => {
      return userStore.get(id?.toString()) || null;
    };

    User.findByIdAndUpdate = async (id, update) => {
      const u = userStore.get(id?.toString());
      if (!u) return null;
      if (update.$set) {
        Object.assign(u, update.$set);
      } else {
        Object.assign(u, update);
      }
      u.updatedAt = new Date();
      return u;
    };

    User.findOneAndUpdate = async (filter, update, options) => {
      let targetUser = null;
      for (const u of userStore.values()) {
        const idMatches = !filter._id || u._id.toString() === filter._id.toString();
        const emailMatches = !filter.email || u.email === filter.email.toLowerCase().trim();
        const googleIdUnset =
          !filter.$or ||
          filter.$or.some((cond) => {
            if (cond.googleId && cond.googleId.$exists === false) return !u.googleId;
            if (cond.googleId === null) return u.googleId === null || u.googleId === undefined;
            if (cond.googleId === '') return u.googleId === '' || !u.googleId;
            return false;
          });

        if (idMatches && emailMatches && googleIdUnset) {
          targetUser = u;
          break;
        }
      }

      if (!targetUser) return null;

      const newGoogleId = update.$set?.googleId || update.googleId;
      if (newGoogleId) {
        for (const u of userStore.values()) {
          if (u._id.toString() !== targetUser._id.toString() && u.googleId === newGoogleId) {
            const err = new Error('E11000 duplicate key error');
            err.code = 11000;
            throw err;
          }
        }
        targetUser.googleId = newGoogleId;
      }

      targetUser.updatedAt = new Date();
      return targetUser;
    };
  }

  // Start test server on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/auth`;

  try {

    // ---------------------------------------------------------
    // TEST 1: Zod validation on login endpoint
    // ---------------------------------------------------------
    const resBadBody = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '' }) // missing password, empty username
    });
    const dataBadBody = await resBadBody.json();
    assert(resBadBody.status === 400, 'Login rejects empty/missing fields with 400');
    assert(dataBadBody.errors && dataBadBody.errors.length > 0, 'Login returns field-level validation errors');

    // ---------------------------------------------------------
    // TEST 2: SEC-03 - Login with wrong username vs wrong password
    // ---------------------------------------------------------
    const resWrongUser = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'wrongadmin', password: TEST_PASSWORD })
    });
    const dataWrongUser = await resWrongUser.json();
    assert(resWrongUser.status === 401, 'Login with wrong username returns 401');
    assert(dataWrongUser.message === 'Invalid credentials', 'Wrong username returns generic "Invalid credentials" message');

    const resWrongPass = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testadmin', password: 'WrongPassword!' })
    });
    const dataWrongPass = await resWrongPass.json();
    assert(resWrongPass.status === 401, 'Login with wrong password returns 401');
    assert(dataWrongPass.message === 'Invalid credentials', 'Wrong password returns generic "Invalid credentials" message');
    assert(dataWrongUser.message === dataWrongPass.message, 'SEC-03: Wrong username and wrong password messages are identical');

    // ---------------------------------------------------------
    // TEST 3: Login with correct credentials
    // ---------------------------------------------------------
    const resSuccess = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testadmin', password: TEST_PASSWORD })
    });
    const dataSuccess = await resSuccess.json();
    assert(resSuccess.status === 200, 'Login with valid credentials returns 200 OK');
    assert(dataSuccess.success === true, 'Login response has success: true');
    assert(typeof dataSuccess.data?.token === 'string', 'Login returns JWT token string');
    assert(dataSuccess.data?.expiresIn === '1h', 'Login returns expiresIn metadata');
    const validToken = dataSuccess.data.token;

    // ---------------------------------------------------------
    // TEST 4: SEC-01 - Staff route without token
    // ---------------------------------------------------------
    const resNoToken = await fetch(`${baseUrl}/verify-staff`);
    const dataNoToken = await resNoToken.json();
    assert(resNoToken.status === 401, 'SEC-01: Staff route without token returns 401');
    assert(dataNoToken.success === false, 'Staff route without token returns success: false');

    // ---------------------------------------------------------
    // TEST 5: Staff route with valid token
    // ---------------------------------------------------------
    const resWithToken = await fetch(`${baseUrl}/verify-staff`, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    const dataWithToken = await resWithToken.json();
    assert(resWithToken.status === 200, 'Staff route with valid token returns 200 OK');
    assert(dataWithToken.user?.role === 'staff', 'Staff route decodes staff role from token');

    // ---------------------------------------------------------
    // TEST 6: SEC-02 - Malformed, tampered, and expired tokens
    // ---------------------------------------------------------
    const resMalformed = await fetch(`${baseUrl}/verify-staff`, {
      headers: { Authorization: 'Bearer this.is.not.a.valid.jwt' }
    });
    assert(resMalformed.status === 401, 'SEC-02: Malformed token returns 401');

    const tamperedToken = validToken.substring(0, validToken.length - 6) + 'abcdef';
    const resTampered = await fetch(`${baseUrl}/verify-staff`, {
      headers: { Authorization: `Bearer ${tamperedToken}` }
    });
    assert(resTampered.status === 401, 'SEC-02: Tampered token returns 401');

    // Generate legitimately expired token
    const expiredToken = jwt.sign(
      { username: 'testadmin', role: 'staff' },
      env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const resExpired = await fetch(`${baseUrl}/verify-staff`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert(resExpired.status === 401, 'SEC-02: Expired token returns 401');

    // ---------------------------------------------------------
    // TEST 7: optionalAuth behavior on Public+ routes
    // ---------------------------------------------------------
    // Case A: Anonymous (no token) -> 200 Public view
    const resOptAnon = await fetch(`${baseUrl}/verify-optional`);
    const dataOptAnon = await resOptAnon.json();
    assert(resOptAnon.status === 200, 'optionalAuth without token returns 200');
    assert(dataOptAnon.isStaff === false, 'optionalAuth without token identifies as non-staff');

    // Case B: Valid token -> 200 Staff view
    const resOptStaff = await fetch(`${baseUrl}/verify-optional`, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    const dataOptStaff = await resOptStaff.json();
    assert(resOptStaff.status === 200, 'optionalAuth with valid token returns 200');
    assert(dataOptStaff.isStaff === true, 'optionalAuth with valid token identifies as staff');

    // Case C: Invalid/expired token on Public+ -> 401 (Section 3.3, SEC-02)
    const resOptExpired = await fetch(`${baseUrl}/verify-optional`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert(resOptExpired.status === 401, 'SEC-02: optionalAuth with expired token returns 401');

    // ---------------------------------------------------------
    // TEST 8: SEC-04 - Login Rate Limiting (429 after repeated failures)
    // ---------------------------------------------------------
    // Rate limit window is 5 max. We already made 3 attempts. Let's make 3 more to trigger 429.
    await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bad1', password: 'bad' })
    });
    await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bad2', password: 'bad' })
    });
    const resRateLimited = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bad3', password: 'bad' })
    });
    assert(resRateLimited.status === 429, 'SEC-04: Repeated login attempts trigger 429 Too Many Requests');
    const dataRateLimited = await resRateLimited.json();
    assert(dataRateLimited.success === false, 'Rate limit response has success: false');

    // ---------------------------------------------------------
    // TEST 9: Gate 8C-A - Staff route rejects student token with 403 Forbidden
    // ---------------------------------------------------------
    const studentToken = jwt.sign(
      { id: 'student_123', email: 'student@campus.fake', role: 'student' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const resStudent = await fetch(`${baseUrl}/verify-staff`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const dataStudent = await resStudent.json();
    assert(resStudent.status === 403, 'Gate 8C-A: Staff route with student token returns 403 Forbidden');
    assert(dataStudent.success === false, 'Gate 8C-A: Student response has success: false');
    assert(dataStudent.message?.includes('Staff access required'), 'Gate 8C-A: Student error message specifies staff access required');

    // ---------------------------------------------------------
    // TEST 10: Gate 8C-A - Staff route rejects other non-staff roles with 403 Forbidden
    // ---------------------------------------------------------
    const guestToken = jwt.sign(
      { id: 'guest_456', role: 'guest' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const resGuest = await fetch(`${baseUrl}/verify-staff`, {
      headers: { Authorization: `Bearer ${guestToken}` }
    });
    assert(resGuest.status === 403, 'Gate 8C-A: Staff route with guest role returns 403 Forbidden');

    // ---------------------------------------------------------
    // TEST 11: Gate 8C-A - optionalAuth correctly identifies non-staff token as isStaff: false
    // ---------------------------------------------------------
    const resOptStudent = await fetch(`${baseUrl}/verify-optional`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const dataOptStudent = await resOptStudent.json();
    assert(resOptStudent.status === 200, 'Gate 8C-A: optionalAuth with student token returns 200');
    assert(dataOptStudent.isStaff === false, 'Gate 8C-A: optionalAuth with student token identifies as isStaff: false');

    // ---------------------------------------------------------
    // TEST 12: Gate 8C-A - Staff claims management endpoint enforces 401 on anon and 403 on student
    // ---------------------------------------------------------
    const resClaimsAnon = await fetch(`http://localhost:${port}/api/claims`);
    assert(resClaimsAnon.status === 401, 'Gate 8C-A: GET /api/claims without token returns 401 Unauthorized');

    const resClaimsStudent = await fetch(`http://localhost:${port}/api/claims`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(resClaimsStudent.status === 403, 'Gate 8C-A: GET /api/claims with student token returns 403 Forbidden');

    // ---------------------------------------------------------
    // TEST 13: Gate 8C-C - Student Registration with valid data
    // ---------------------------------------------------------
    const resRegValid = await fetch(`${baseUrl}/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.9.1' },
      body: JSON.stringify({
        name: 'Jane Student',
        email: 'jane.student@campus.edu',
        password: 'Password123!'
      })
    });
    const dataRegValid = await resRegValid.json();
    assert(resRegValid.status === 201, 'Gate 8C-C: Valid student registration returns 201 Created');
    assert(dataRegValid.success === true, 'Gate 8C-C: Registration response has success: true');
    assert(dataRegValid.data?.user?.role === 'student', 'Gate 8C-C: Registered user has role: student');
    assert(dataRegValid.data?.user?.passwordHash === undefined, 'Gate 8C-C: passwordHash excluded from registration response');
    assert(typeof dataRegValid.data?.token === 'string', 'Gate 8C-C: Registration returns signed student JWT');
    const registeredStudentToken = dataRegValid.data.token;
    const registeredStudentUserId = dataRegValid.data.user._id;

    // ---------------------------------------------------------
    // TEST 14: Gate 8C-C - Duplicate registration returns 409 Conflict
    // ---------------------------------------------------------
    const resRegDup = await fetch(`${baseUrl}/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.9.2' },
      body: JSON.stringify({
        name: 'Jane Duplicate',
        email: 'jane.student@campus.edu',
        password: 'Password123!'
      })
    });
    assert(resRegDup.status === 409, 'Gate 8C-C: Duplicate student registration returns 409 Conflict');

    // ---------------------------------------------------------
    // TEST 15: Gate 8C-C - Student registration rejects privileged field injection
    // ---------------------------------------------------------
    const resRegPriv = await fetch(`${baseUrl}/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.9.3' },
      body: JSON.stringify({
        name: 'Evil Student',
        email: 'evil@campus.edu',
        password: 'Password123!',
        role: 'staff'
      })
    });
    assert(resRegPriv.status === 400, 'Gate 8C-C: Registration rejects role injection with 400');

    // ---------------------------------------------------------
    // TEST 16: Gate 8C-C - Student login with valid credentials
    // ---------------------------------------------------------
    const resLogValid = await fetch(`${baseUrl}/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.9.4' },
      body: JSON.stringify({
        email: 'JANE.STUDENT@campus.edu', // case normalization
        password: 'Password123!'
      })
    });
    const dataLogValid = await resLogValid.json();
    assert(resLogValid.status === 200, 'Gate 8C-C: Valid student login returns 200 OK');
    assert(dataLogValid.data?.user?.role === 'student', 'Gate 8C-C: Logged in user role is student');
    assert(typeof dataLogValid.data?.token === 'string', 'Gate 8C-C: Login returns valid JWT');

    // ---------------------------------------------------------
    // TEST 17: Gate 8C-C - Student login with invalid password returns 401
    // ---------------------------------------------------------
    const resLogBadPass = await fetch(`${baseUrl}/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.9.5' },
      body: JSON.stringify({
        email: 'jane.student@campus.edu',
        password: 'WrongPassword999!'
      })
    });
    const dataLogBadPass = await resLogBadPass.json();
    assert(resLogBadPass.status === 401, 'Gate 8C-C: Incorrect password returns 401');
    assert(dataLogBadPass.message === 'Invalid email or password', 'Gate 8C-C: Generic message on bad password');

    // ---------------------------------------------------------
    // TEST 18: Gate 8C-C - Student login with unknown email returns 401
    // ---------------------------------------------------------
    const resLogBadEmail = await fetch(`${baseUrl}/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.9.6' },
      body: JSON.stringify({
        email: 'nonexistent@campus.edu',
        password: 'Password123!'
      })
    });
    const dataLogBadEmail = await resLogBadEmail.json();
    assert(resLogBadEmail.status === 401, 'Gate 8C-C: Unknown email returns 401');
    assert(dataLogBadPass.message === dataLogBadEmail.message, 'Gate 8C-C: Timing/error leakage prevented: bad pass and bad email match');

    // ---------------------------------------------------------
    // TEST 19: Gate 8C-C - GET /api/auth/me returns student profile
    // ---------------------------------------------------------
    const resMeValid = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${registeredStudentToken}` }
    });
    const dataMeValid = await resMeValid.json();
    assert(resMeValid.status === 200, 'Gate 8C-C: GET /api/auth/me with valid student token returns 200 OK');
    assert(dataMeValid.data?.user?.email === 'jane.student@campus.edu', 'Gate 8C-C: /me returns student email');
    assert(dataMeValid.data?.user?.role === 'student', 'Gate 8C-C: /me returns student role');
    assert(dataMeValid.data?.user?.passwordHash === undefined, 'Gate 8C-C: /me never exposes passwordHash');

    // ---------------------------------------------------------
    // TEST 20: Gate 8C-C - GET /api/auth/me role isolation: rejects staff token (403) and missing token (401)
    // ---------------------------------------------------------
    const resMeStaff = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    assert(resMeStaff.status === 403, 'Gate 8C-C: Staff token on GET /api/auth/me returns 403 Forbidden');

    const resMeNoToken = await fetch(`${baseUrl}/me`);
    assert(resMeNoToken.status === 401, 'Gate 8C-C: Missing token on GET /api/auth/me returns 401 Unauthorized');

    // =========================================================
    // STUDENT GOOGLE SIGN-IN TESTS (Phase 1)
    // =========================================================
    const originalVerifyIdToken = OAuth2Client.prototype.verifyIdToken;

    // TEST 21: POST /api/auth/student/google with missing credential returns 400 Bad Request
    const resGoogleMissing = await fetch(`${baseUrl}/student/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.10.1' },
      body: JSON.stringify({})
    });
    const dataGoogleMissing = await resGoogleMissing.json();
    assert(resGoogleMissing.status === 400, 'Student Google Sign-In: Missing credential returns 400 Bad Request');
    assert(dataGoogleMissing.errors !== undefined || dataGoogleMissing.message !== undefined, 'Student Google Sign-In: Zod rejects missing body fields');

    // TEST 22: POST /api/auth/student/google with invalid Google token returns 401 Unauthorized
    const resGoogleInvalid = await fetch(`${baseUrl}/student/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.10.2' },
      body: JSON.stringify({ credential: 'invalid.google.id.token.string' })
    });
    const dataGoogleInvalid = await resGoogleInvalid.json();
    assert(resGoogleInvalid.status === 401, 'Student Google Sign-In: Invalid Google token returns 401 Unauthorized');
    assert(dataGoogleInvalid.message === 'Invalid or expired Google authentication token', 'Student Google Sign-In: Generic safe message on token failure');

    // TEST 23: POST /api/auth/student/google with unverified email returns 403 Forbidden
    OAuth2Client.prototype.verifyIdToken = async () => ({
      getPayload: () => ({
        sub: 'google-sub-unverified-123',
        email: 'unverified.student@campus.edu',
        email_verified: false,
        name: 'Unverified Student'
      })
    });

    const resGoogleUnverified = await fetch(`${baseUrl}/student/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.10.3' },
      body: JSON.stringify({ credential: 'mock.valid.token.unverified' })
    });
    const dataGoogleUnverified = await resGoogleUnverified.json();
    assert(resGoogleUnverified.status === 403, 'Student Google Sign-In: Unverified email returns 403 Forbidden');
    assert(dataGoogleUnverified.message.includes('not verified'), 'Student Google Sign-In: Rejects unverified email with clear explanation');

    // TEST 24: POST /api/auth/student/google with valid new student creates account & returns JWT
    OAuth2Client.prototype.verifyIdToken = async () => ({
      getPayload: () => ({
        sub: 'google-sub-student-456',
        email: 'alice.google@campus.edu',
        email_verified: true,
        name: 'Alice Google'
      })
    });

    const resGoogleValid = await fetch(`${baseUrl}/student/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.10.4' },
      body: JSON.stringify({ credential: 'mock.valid.token.alice' })
    });
    const dataGoogleValid = await resGoogleValid.json();
    assert(resGoogleValid.status === 200, 'Student Google Sign-In: Valid Google student returns 200 OK');
    assert(typeof dataGoogleValid.data?.token === 'string', 'Student Google Sign-In: Issues valid JWT string');
    assert(dataGoogleValid.data?.user?.email === 'alice.google@campus.edu', 'Student Google Sign-In: User email matches Google profile');
    assert(dataGoogleValid.data?.user?.role === 'student', 'Student Google Sign-In: Role is strictly student');
    assert(dataGoogleValid.data?.user?.authProvider === 'google', 'Student Google Sign-In: authProvider is recorded as google');
    const googleStudentToken = dataGoogleValid.data?.token;

    // TEST 25: POST /api/auth/student/google with returning student logs in without duplicating account
    const resGoogleReturning = await fetch(`${baseUrl}/student/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.10.5' },
      body: JSON.stringify({ credential: 'mock.valid.token.alice.again' })
    });
    const dataGoogleReturning = await resGoogleReturning.json();
    assert(resGoogleReturning.status === 200, 'Student Google Sign-In: Returning Google student returns 200 OK');
    assert(dataGoogleReturning.data?.user?._id === dataGoogleValid.data?.user?._id, 'Student Google Sign-In: Resolves same existing user ID');

    // ---------------------------------------------------------
    // TEST 26: Gate 8C-C/Phase 3 - Safe Google Account Linking
    // ---------------------------------------------------------
    // (a) Matching verified Google email links to existing local account and preserves user ID
    OAuth2Client.prototype.verifyIdToken = async () => ({
      getPayload: () => ({
        sub: 'google-sub-jane-789',
        email: 'jane.student@campus.edu', // registered as local password user in Test 13
        email_verified: true,
        name: 'Jane Google'
      })
    });

    const resGoogleLink = await fetch(`${baseUrl}/student/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.10.6' },
      body: JSON.stringify({ credential: 'mock.valid.token.jane' })
    });
    const dataGoogleLink = await resGoogleLink.json();
    assert(resGoogleLink.status === 200, 'Phase 3: Verified Google email links to existing local account (200 OK)');
    assert(dataGoogleLink.data?.user?._id === registeredStudentUserId, 'Phase 3: Account linking preserves original student _id');
    assert(dataGoogleLink.data?.user?.email === 'jane.student@campus.edu', 'Phase 3: Linked account email matches original email');
    assert(dataGoogleLink.data?.user?.authProvider === 'local', 'Phase 3: Original authProvider remains "local" to protect password login');
    assert(typeof dataGoogleLink.data?.token === 'string', 'Phase 3: Account linking returns valid student JWT');

    // (b) Dual login verification: Original email/password login continues to work after linking
    const resLocalPasswordAfterLink = await fetch(`${baseUrl}/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.10.7' },
      body: JSON.stringify({
        email: 'jane.student@campus.edu',
        password: 'Password123!'
      })
    });
    const dataLocalPasswordAfterLink = await resLocalPasswordAfterLink.json();
    assert(resLocalPasswordAfterLink.status === 200, 'Phase 3: Dual login verified: Original email/password login succeeds after Google linking');
    assert(dataLocalPasswordAfterLink.data?.user?._id === registeredStudentUserId, 'Phase 3: Password login resolves same student _id');

    // (c) Subsequent Google login resolves same linked account via googleId
    const resGoogleLinkedSubsequent = await fetch(`${baseUrl}/student/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.10.8' },
      body: JSON.stringify({ credential: 'mock.valid.token.jane.again' })
    });
    const dataGoogleLinkedSubsequent = await resGoogleLinkedSubsequent.json();
    assert(resGoogleLinkedSubsequent.status === 200, 'Phase 3: Subsequent Google login resolves linked account directly via googleId');
    assert(dataGoogleLinkedSubsequent.data?.user?._id === registeredStudentUserId, 'Phase 3: Subsequent Google login preserves original _id');

    // (d) Conflicting Google identity: different Google subject cannot overwrite already-linked account
    OAuth2Client.prototype.verifyIdToken = async () => ({
      getPayload: () => ({
        sub: 'google-sub-impostor-999',
        email: 'jane.student@campus.edu',
        email_verified: true,
        name: 'Jane Impostor'
      })
    });

    const resGoogleConflict = await fetch(`${baseUrl}/student/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.10.9' },
      body: JSON.stringify({ credential: 'mock.valid.token.conflict' })
    });
    const dataGoogleConflict = await resGoogleConflict.json();
    assert(resGoogleConflict.status === 409, 'Phase 3: Conflicting Google identity returns 409 Conflict without overwriting existing googleId');
    assert(dataGoogleConflict.code === 'ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_GOOGLE_ACCOUNT', 'Phase 3: Returns ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_GOOGLE_ACCOUNT error code');

    // (e) Unverified Google email cannot link or access existing account
    OAuth2Client.prototype.verifyIdToken = async () => ({
      getPayload: () => ({
        sub: 'google-sub-unverified-jane',
        email: 'jane.student@campus.edu',
        email_verified: false,
        name: 'Jane Unverified'
      })
    });

    const resGoogleUnverifiedLink = await fetch(`${baseUrl}/student/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.10.10' },
      body: JSON.stringify({ credential: 'mock.unverified.token' })
    });
    assert(resGoogleUnverifiedLink.status === 403, 'Phase 3: Unverified Google email rejected with 403 without linking or authenticating');

    // TEST 27: Student Google token access and strict staff isolation
    // (a) Google student token can access /api/auth/me
    const resGoogleMe = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${googleStudentToken}` }
    });
    const dataGoogleMe = await resGoogleMe.json();
    assert(resGoogleMe.status === 200, 'Student Google Sign-In: Google student token can access GET /api/auth/me');
    assert(dataGoogleMe.data?.user?.email === 'alice.google@campus.edu', 'Student Google Sign-In: /me returns student profile');

    // (b) Google student token CANNOT access staff endpoint /api/auth/verify-staff
    const resGoogleStaffCheck = await fetch(`${baseUrl}/verify-staff`, {
      headers: { Authorization: `Bearer ${googleStudentToken}` }
    });
    assert(resGoogleStaffCheck.status === 403, 'Student Google Sign-In: Staff isolation verified: Google student token rejected by requireStaff with 403 Forbidden');

    // =========================================================
    // TEST 28: STUDENT FORGOT PASSWORD & RESET PASSWORD (PHASE A)
    // =========================================================
    const capturedEmails = [];
    setMockMailHandler(async (mail) => {
      capturedEmails.push(mail);
    });

    // TEST 28a: POST /api/auth/student/forgot-password with non-existent email returns generic 200 without sending email
    capturedEmails.length = 0;
    const resForgotNobody = await fetch(`${baseUrl}/student/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.1' },
      body: JSON.stringify({ email: 'nobody@campus.edu' })
    });
    const dataForgotNobody = await resForgotNobody.json();
    assert(resForgotNobody.status === 200, 'Forgot Password: Non-existent email returns 200 generic response');
    assert(dataForgotNobody.message.includes('receive password reset instructions shortly'), 'Forgot Password: Non-existent email returns exact generic message');
    assert(capturedEmails.length === 0, 'Forgot Password: Non-existent email dispatches no email');

    // TEST 28b: POST /api/auth/student/forgot-password with valid student email (case normalization)
    capturedEmails.length = 0;
    const resForgotValid = await fetch(`${baseUrl}/student/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.2' },
      body: JSON.stringify({ email: 'JANE.STUDENT@campus.edu' })
    });
    const dataForgotValid = await resForgotValid.json();
    assert(resForgotValid.status === 200, 'Forgot Password: Valid student email returns 200 generic response');
    assert(dataForgotValid.message === dataForgotNobody.message, 'Forgot Password: Valid and invalid emails return identical generic response');
    assert(capturedEmails.length === 1, 'Forgot Password: Valid student email dispatches reset email');
    assert(capturedEmails[0].type === 'password_reset', 'Forgot Password: Email type is password_reset');
    assert(capturedEmails[0].to === 'jane.student@campus.edu', 'Forgot Password: Email recipient is normalized student email');
    assert(typeof capturedEmails[0].resetUrl === 'string' && capturedEmails[0].resetUrl.includes('token='), 'Forgot Password: Email contains reset URL with token');

    // TEST 28c: Database verification: Token stored as SHA-256 hash, not raw token; expiration ~15m
    const rawResetToken = new URL(capturedEmails[0].resetUrl).searchParams.get('token');
    const expectedTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const studentUser = await User.findOne({ email: 'jane.student@campus.edu' }).select('+passwordResetToken +passwordResetExpires');
    assert(studentUser.passwordResetToken === expectedTokenHash, 'Forgot Password: Token is stored as SHA-256 hash in database');
    assert(studentUser.passwordResetToken !== rawResetToken, 'Forgot Password: Raw token is never stored in database');
    const expiresDiffMs = new Date(studentUser.passwordResetExpires).getTime() - Date.now();
    assert(expiresDiffMs > 14 * 60 * 1000 && expiresDiffMs <= 15 * 60 * 1000 + 5000, 'Forgot Password: Token expiration set to ~15 minutes');

    // TEST 28d: Cooldown: Duplicate request within 60s returns generic 200 without sending second email
    capturedEmails.length = 0;
    const resForgotCooldown = await fetch(`${baseUrl}/student/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.3' },
      body: JSON.stringify({ email: 'jane.student@campus.edu' })
    });
    const dataForgotCooldown = await resForgotCooldown.json();
    assert(resForgotCooldown.status === 200, 'Forgot Password: Cooldown request returns 200 generic response');
    assert(dataForgotCooldown.message === dataForgotNobody.message, 'Forgot Password: Cooldown response message matches generic message');
    assert(capturedEmails.length === 0, 'Forgot Password: Cooldown suppresses duplicate email dispatch within 60 seconds');

    // TEST 28e: POST /api/auth/student/reset-password with valid token resets password
    const resResetSuccess = await fetch(`${baseUrl}/student/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.4' },
      body: JSON.stringify({
        token: rawResetToken,
        password: 'NewValidPassword456!'
      })
    });
    const dataResetSuccess = await resResetSuccess.json();
    assert(resResetSuccess.status === 200, 'Reset Password: Valid token successfully resets password (200 OK)');
    assert(dataResetSuccess.message.includes('reset successfully'), 'Reset Password: Returns confirmation message');

    // TEST 28f: Token invalidation: Reusing the same reset token returns 400 Bad Request
    const resResetReuse = await fetch(`${baseUrl}/student/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.5' },
      body: JSON.stringify({
        token: rawResetToken,
        password: 'AnotherPassword789!'
      })
    });
    assert(resResetReuse.status === 400, 'Reset Password: Single-use guarantee: Reused token rejected with 400 Bad Request');

    // TEST 28g: Dual login check: Login with new password succeeds, old password fails
    const resLoginNewPass = await fetch(`${baseUrl}/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.6' },
      body: JSON.stringify({
        email: 'jane.student@campus.edu',
        password: 'NewValidPassword456!'
      })
    });
    assert(resLoginNewPass.status === 200, 'Reset Password: Login with new password succeeds with 200 OK');

    const resLoginOldPass = await fetch(`${baseUrl}/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.7' },
      body: JSON.stringify({
        email: 'jane.student@campus.edu',
        password: 'Password123!'
      })
    });
    assert(resLoginOldPass.status === 401, 'Reset Password: Login with old password rejected with 401 Unauthorized');

    // TEST 28h: POST /api/auth/student/reset-password rejects malformed / invalid tokens
    const resResetInvalidToken = await fetch(`${baseUrl}/student/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.8' },
      body: JSON.stringify({
        token: 'invalid000000000000000000000000000000000000000000000000000000000000',
        password: 'SomePassword123!'
      })
    });
    assert(resResetInvalidToken.status === 400, 'Reset Password: Unknown token rejected with 400 Bad Request');

    const resResetEmptyToken = await fetch(`${baseUrl}/student/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.9' },
      body: JSON.stringify({
        token: '',
        password: 'SomePassword123!'
      })
    });
    assert(resResetEmptyToken.status === 400, 'Reset Password: Empty token rejected with 400 Bad Request');

    // TEST 28i: Expired token rejection
    const expiredRawToken = crypto.randomBytes(32).toString('hex');
    const expiredTokenHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
    studentUser.passwordResetToken = expiredTokenHash;
    studentUser.passwordResetExpires = new Date(Date.now() - 5000); // 5 seconds in past
    if (typeof studentUser.save === 'function') {
      await studentUser.save();
    }

    const resResetExpired = await fetch(`${baseUrl}/student/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.10' },
      body: JSON.stringify({
        token: expiredRawToken,
        password: 'AnotherPassword123!'
      })
    });
    assert(resResetExpired.status === 400, 'Reset Password: Expired token rejected with 400 Bad Request');

    // TEST 28j: Security Decision #6: Google-only account handling
    capturedEmails.length = 0;
    const resForgotGoogle = await fetch(`${baseUrl}/student/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.11' },
      body: JSON.stringify({ email: 'alice.google@campus.edu' })
    });
    const dataForgotGoogle = await resForgotGoogle.json();
    assert(resForgotGoogle.status === 200, 'Forgot Password (Google-only): Returns generic 200 response');
    assert(dataForgotGoogle.message === dataForgotNobody.message, 'Forgot Password (Google-only): Generic message prevents enumeration');
    assert(capturedEmails.length === 1, 'Forgot Password (Google-only): Dispatches notice email');
    assert(capturedEmails[0].type === 'google_notice', 'Forgot Password (Google-only): Notice email directs student to Google Sign-In');
    assert(capturedEmails[0].to === 'alice.google@campus.edu', 'Forgot Password (Google-only): Notice email recipient is student');

    const googleUser = await User.findOne({ email: 'alice.google@campus.edu' }).select('+passwordResetToken');
    assert(!googleUser.passwordResetToken, 'Forgot Password (Google-only): No password reset token created or stored');
    assert(googleUser.authProvider === 'google', 'Forgot Password (Google-only): authProvider preserved as google');

    // TEST 28k: Staff isolation: Staff accounts are completely unaffected
    capturedEmails.length = 0;
    const resForgotStaff = await fetch(`${baseUrl}/student/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.12' },
      body: JSON.stringify({ email: 'testadmin@campus.edu' })
    });
    assert(resForgotStaff.status === 200, 'Forgot Password (Staff Isolation): Returns 200 generic response without error');
    assert(capturedEmails.length === 0, 'Forgot Password (Staff Isolation): No email dispatched for staff username/email');

    // Verify staff login still works with existing credentials
    const resStaffLoginCheck = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.11.13' },
      body: JSON.stringify({
        username: 'testadmin',
        password: TEST_PASSWORD
      })
    });
    assert(resStaffLoginCheck.status === 200, 'Forgot Password (Staff Isolation): Staff credentials and login remain completely functional');

  } finally {
    setMockMailHandler(null);
    if (typeof originalVerifyIdToken === 'function') {
      OAuth2Client.prototype.verifyIdToken = originalVerifyIdToken;
    }
    if (!isDbConnected && originalUserMethods.findOne) {
      User.findOne = originalUserMethods.findOne;
      User.create = originalUserMethods.create;
      User.findById = originalUserMethods.findById;
      User.findOneAndUpdate = originalUserMethods.findOneAndUpdate;
      User.findByIdAndUpdate = originalUserMethods.findByIdAndUpdate;
    }
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`\nPhase 4 Test Results: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests();

