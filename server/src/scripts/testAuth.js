import http from 'http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { env } from '../config/env.js';

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

  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`\nPhase 4 Test Results: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests();
