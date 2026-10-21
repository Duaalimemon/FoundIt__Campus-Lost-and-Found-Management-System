# FoundIt — Test Execution Log

This log records test executions, dates, results, and evidence filenames for project assessment.

| Test ID | Description | Target | Date | Result | Notes / Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API-01** (part) | Unknown route returns 404 | API | 2026-10-20 | **PASS** | `GET /api/unknown-route` returned 404 `{ success: false, message: 'Route not found: GET /api/unknown-route' }` |
| **SEC-08** | Disallowed CORS origin blocked | API | 2026-10-20 | **PASS** | `Origin: http://malicious-site.com` returned 403 Forbidden with CORS rejection message |
| **SEC-CORS** | Allowed origin receives CORS header | API | 2026-10-20 | **PASS** | `Origin: http://localhost:5173` returned 200 with `Access-Control-Allow-Origin: http://localhost:5173` |
| **HEALTH-01** | API health check endpoint | API | 2026-10-20 | **PASS** | `GET /api/health` returned 200 OK `{ success: true, message: 'FoundIt API is running healthy', data: { status: 'ok', ... } }` |
| **GUARD-01** | Startup switch guard (Section 9.1) | API | 2026-10-20 | **PASS** | Server startup aborts with exit code 1 if `FAIL_WRITE` is set while `NODE_ENV !== 'test'` |
| **BUILD-01** | Client Vite production build | Client | 2026-10-20 | **PASS** | Vite v6.4.4 built client in 1.72s with zero errors |
| **MOD-01** | LostItem schema validation | Models | 2026-10-20 | **PASS** | Passed 8 validation checks: valid pass, title length, category enum, description, location, email, phone |
| **MOD-02** | FoundItem schema validation | Models | 2026-10-20 | **PASS** | Passed 3 validation checks: valid pass, required storageLocation, status enum |
| **MOD-03** | ClaimRequest schema validation | Models | 2026-10-20 | **PASS** | Passed 4 validation checks: valid pending, proof description length, required conditional adminNote on rejection |
| **SEED-01** | Seed fail-fast on missing URI | Scripts | 2026-10-20 | **PASS** | `node src/scripts/seed.js` exits cleanly with code 1 if `MONGODB_URI` is not set |
| **AUTH-01** | Valid staff login generates JWT | Auth API | 2026-10-21 | **PASS** | `POST /api/auth/login` with valid credentials returns 200 OK with signed JWT token and `expiresIn: '1h'` |
| **SEC-01** | Staff endpoint guard without token | Auth API | 2026-10-21 | **PASS** | `GET /api/auth/verify-staff` without token returns 401 Unauthorized `{ success: false, message: 'Authentication required. No token provided.' }` |
| **SEC-02** | Malformed, tampered & expired tokens | Auth API | 2026-10-21 | **PASS** | Verified on staff and Public+ routes; malformed, tampered, and expired tokens return 401 `{ success: false, message: 'Invalid or expired authentication token' }` |
| **SEC-03** | Generic 401 for wrong credentials | Auth API | 2026-10-21 | **PASS** | `POST /api/auth/login` with wrong username and wrong password both return identical 401 `{ success: false, message: 'Invalid credentials' }` |
| **SEC-04** | Login rate limit after repeated failures | Auth API | 2026-10-21 | **PASS** | Repeated failed login attempts trigger 429 Too Many Requests `{ success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }` |
| **DEP-01** | Live site loads without error | System | — | Pending | Scheduled for Phase 10 |
| **DEP-03** | Deep link loads on static host | Frontend | — | Pending | `public/_redirects` configured; verified in Phase 10 |
