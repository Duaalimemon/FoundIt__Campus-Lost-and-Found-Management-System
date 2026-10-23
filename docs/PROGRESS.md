# FoundIt — Development Progress Checklist

Status Key:
- `[x]` Completed and verified
- `[/]` In progress
- `[ ]` Not started
- `[?]` Needs verification / Unconfirmed

---

## Phase Status Summary

- [x] **Phase 1: Project Inspection and Requirement Confirmation (Read-Only)**
  - Completed on 20 Oct 2026.
  - Workspace inspected (empty directory), requirements and architecture restated, open questions cataloged.
- [x] **Phase 2: Initial Setup and Walking-Skeleton Deployment**
  - Completed on 20 Oct 2026.
  - Directory structure, `.gitignore`, docs, minimal Express server, minimal React client, health endpoint, and CORS allow-list verified.
- [x] **Phase 3: Database Connection, Models and Seed Data**
  - Completed on 20 Oct 2026.
  - `db.js` connection module, 3 Mongoose models (`LostItem`, `FoundItem`, `ClaimRequest`), indexes, validation suite, and repeatable seed script established.
- [x] **Phase 4: Staff Authentication and Security Middleware**
  - Completed on 21 Oct 2026.
  - `hashPassword.js`, `POST /api/auth/login`, `requireAuth`, `optionalAuth`, login rate limiter, generic 401 handling, Zod `validate` middleware, and test suite verified.
- [x] **Phase 5: Backend CRUD APIs and Claim Workflow**
  - [x] Gate 5A: LostItem CRUD (Zod schemas including DR-1, 5 endpoints, public vs staff projection, list query)
  - [x] Gate 5B: FoundItem CRUD (Zod schemas including DR-1, 5 endpoints, edit/delete protections, status immutability)
  - [x] Gate 5C: ClaimRequest Workflow & Test Failure Switch (two-write recovery, consistency invariants, test-only switch & TD-1 to TD-6 isolation)
- [ ] **Phase 6: API Testing**
- [ ] **Phase 7: Frontend Structure and Reusable Components**
- [ ] **Phase 8: Frontend-Backend Integration of Modules**
  - [ ] Gate 8A: Public Flows
  - [ ] Gate 8B: Staff Flows
- [ ] **Phase 9: Validation, Error Handling, Final Testing, Bug Fixing**
- [ ] **Phase 10: Deployment and Production Testing**
- [ ] **Phase 11: Documentation, Report, Demo & Final Submission**

---

## Phase 4 Completed Verification

- [x] Created `server/src/scripts/hashPassword.js` generating bcrypt hash with 10 salt rounds for `ADMIN_PASSWORD_HASH`.
- [x] Created Zod login validation schema in `server/src/validators/auth.validator.js`.
- [x] Created central request validation middleware in `server/src/middleware/validate.js`.
- [x] Created login rate limiter in `server/src/middleware/rateLimit.js` returning 429 Too Many Requests after 5 attempts.
- [x] Created authentication middlewares in `server/src/middleware/auth.js`:
  - `requireAuth`: Strict staff guard rejecting missing, malformed, tampered, or expired tokens with 401.
  - `optionalAuth`: Dual-audience middleware permitting anonymous callers with `req.user = null`, attaching staff identity when token is valid, and returning 401 when token is invalid or expired.
- [x] Created authentication controller in `server/src/controllers/auth.controller.js` implementing timing-attack-safe comparison and generic 401 errors (`SEC-03`).
- [x] Created auth routes in `server/src/routes/auth.routes.js` and mounted `/api/auth` in `server/src/app.js`.
- [x] Configured `app.set('trust proxy', 1)` in `server/src/app.js` for reverse proxy compatibility.
- [x] Created comprehensive test suite in `server/src/scripts/testAuth.js` with 25 passing assertions (`SEC-01`, `SEC-02`, `SEC-03`, `SEC-04`, `AUTH-01`).
- [x] Updated `docs/test-log.md` with Phase 4 test entries.

---

## Gate 5A: LostItem CRUD Completed Verification

- [x] Created regex escaping helper in `server/src/utils/escapeRegex.js` to guard text search against ReDoS and regex special characters.
- [x] Created reusable Zod validators in `server/src/validators/common.js`:
  - `objectIdSchema`: Validates 24-character hexadecimal MongoDB ObjectIds.
  - `dr1DateSchema`: Enforces Date Rule DR-1 (valid calendar date string, campus timezone `Asia/Karachi`, rejects future dates, stores midnight UTC, allows historical past dates).
  - `dr2DateFilterSchema`: Enforces Date Rule DR-2 for list filtering (`dateFrom <= dateTo`).
- [x] Created LostItem validation schemas in `server/src/validators/lostItem.validator.js`:
  - `createLostItemSchema`: Strips client-supplied status, validates title (3-100), category enum, description (10-1000), location (2-100), dateLost (DR-1), reporter details.
  - `updateLostItemSchema`: Allows staff to update fields and toggle status freely between `open` and `resolved` (Section 5.2, 5.6).
  - `lostItemIdParamSchema`: Enforces 24-hex ObjectId on params (LST-07).
  - `listLostItemsQuerySchema`: Validates pagination (`page`, `limit`), optional filters (`q`, `category`, `status`, `dateFrom`, `dateTo`).
- [x] Created LostItem controller in `server/src/controllers/lostItem.controller.js`:
  - `POST /api/lost-items`: Implements Section 6.5 create privacy rule (`PUBLIC_FIELDS.lostItem` reload, zero reporter contact exposure in raw JSON).
  - `GET /api/lost-items`: Dual-audience projection via `optionalAuth`, text search, category/status/date range filters, pagination meta.
  - `GET /api/lost-items/:id`: Dual-audience detail projection (public hides reporter contact details; staff receives full record).
  - `PUT /api/lost-items/:id`: Staff-only update with status toggle (`open` <-> `resolved`).
  - `DELETE /api/lost-items/:id`: Staff-only deletion.
- [x] Created routes in `server/src/routes/lostItem.routes.js` and mounted at `/api/lost-items` in `server/src/app.js`.
- [x] Created comprehensive automated test suite `server/src/scripts/testLostItems.js` with 50 passing assertions covering LST-01 through LST-09, SEC-05, SEC-06, SEC-07.
- [x] Added `test:lost` script to `server/package.json`.
- [x] Verified full regression suite passes cleanly (`test:models`: 15/15, `test:auth`: 25/25, `test:lost`: 50/50).
- [x] Updated `docs/test-log.md` with LST-01 to LST-09 and SEC-05 to SEC-07 entries.

---

## Gate 5B: FoundItem CRUD Completed Verification

- [x] Created FoundItem validation schemas in `server/src/validators/foundItem.validator.js`:
  - `createFoundItemSchema`: Strips client-supplied status, validates title (3-100), category enum, description (10-1000), foundLocation (2-100), dateFound (DR-1), storageLocation (2-100), finderName (2-80), finderEmail, finderPhone, verificationNotes.
  - `updateFoundItemSchema`: Validates update fields, allows optional status enum to reject invalid values, while status modification through PUT is strictly blocked.
  - `foundItemIdParamSchema`: Enforces 24-hex ObjectId format on params (FND-07).
  - `listFoundItemsQuerySchema`: Validates pagination, filters (`q`, `category`, `status`), and DR-2 date range.
- [x] Created FoundItem controller in `server/src/controllers/foundItem.controller.js`:
  - `POST /api/found-items`: Implements Section 6.5 privacy rule (`PUBLIC_FIELDS.foundItem` reload, strictly hides `storageLocation`, `finderName`, `finderEmail`, `finderPhone`, `verificationNotes`, `__v`, `updatedAt` in raw JSON).
  - `GET /api/found-items`: Dual-audience projection via `optionalAuth`, ReDoS-safe search, filters, pagination meta.
  - `GET /api/found-items/:id`: Dual-audience detail projection (anonymous hides private details; staff receives full record).
  - `PUT /api/found-items/:id`: Staff-only update with two critical protections:
    1. Status immutability: Rejects attempts to change status via PUT with 400.
    2. Edit restriction: Editing permitted ONLY while status is `available` (editing claimed or returned items rejected with 400).
  - `DELETE /api/found-items/:id`: Staff-only delete with claim reference protection:
    - If any `ClaimRequest` references the item, deletion is blocked with HTTP 409 Conflict returning `claimCount`.
    - If no claims reference the item, deletion succeeds with 200 OK and subsequent GET returns 404.
- [x] Created routes in `server/src/routes/foundItem.routes.js` and mounted at `/api/found-items` in `server/src/app.js`.
- [x] Created comprehensive test suite `server/src/scripts/testFoundItems.js` with 62 passing assertions covering FND-01 through FND-08, SEC-05, SEC-06, SEC-07.
- [x] Added `test:found` script to `server/package.json`.
- [x] Verified full regression suite passes cleanly (`test:models`: 15/15, `test:auth`: 25/25, `test:lost`: 50/50, `test:found`: 62/62).
- [x] Updated `docs/test-log.md` with FND-01 to FND-08 entries.

---

## Gate 5C: Claims, Workflow, Dashboard Summary & Failure Switch Completed Verification

- [x] Created ClaimRequest validation schemas in `server/src/validators/claim.validator.js`:
  - `createClaimSchema`: Strips client-supplied status and adminNote, validates `foundItem` (24-hex ObjectId), `claimantName` (2-80), `claimantEmail`, `claimantPhone`, `proofDescription` (20-1000).
  - `updateClaimStatusSchema`: Enforces valid claim status enum, enforces conditional `adminNote` (>= 5 chars) when status is `rejected`.
  - `claimIdParamSchema`: Enforces 24-hex ObjectId format on claim `:id` params.
  - `listClaimsQuerySchema`: Validates pagination, filters (`status`, `foundItem`), and search `q`.
- [x] Created ClaimRequest controller in `server/src/controllers/claim.controller.js`:
  - `POST /api/claims`: Public creation, checks target FoundItem existence, blocks claims on non-available items, prevents duplicate active claims (409 Conflict), defaults status to `pending`.
  - `GET /api/claims`: Staff-only list with pagination, search, status and item filters.
  - `GET /api/claims/:id`: Staff-only detail retrieval.
  - `PUT /api/claims/:id`: Staff-only status transition handler enforcing `ALLOWED_CLAIM_TRANSITIONS`, conditional admin notes, two-write workflow, and compensating recovery:
    - `pending` &rarr; `approved`: sets FoundItem to `claimed` (INV-1).
    - `approved` &rarr; `completed`: sets FoundItem to `returned` (INV-2).
    - `approved` &rarr; `rejected`: reverts FoundItem to `available` (INV-3).
    - `pending` &rarr; `rejected`: preserves FoundItem as `available`.
    - `FAIL_WRITE` switch handling: catches simulated failure during secondary write, executes compensating transaction rolling claim back to original status, returns HTTP 500 with `{ recovered: true }`.
  - `DELETE /api/claims/:id`: Staff-only deletion; blocks deletion of `completed` claims (400), reverts FoundItem to `available` if deleting an `approved` claim (INV-3).
- [x] Created Dashboard Summary controller in `server/src/controllers/dashboard.controller.js` & routes in `server/src/routes/dashboard.routes.js`:
  - `GET /api/dashboard`, `/summary`, `/stats`: Returns aggregate metrics across Lost, Found, and Claim records.
- [x] Mounted `/api/claims` and `/api/dashboard` in `server/src/app.js`.
- [x] Created comprehensive test suite `server/src/scripts/testClaims.js` with 50 passing assertions covering CLM-01 to CLM-08, INV-1, INV-2, INV-3, FAIL_WRITE, and DASH-01 with TD-1 to TD-6 isolation.
- [x] Added `test:claims` script to `server/package.json`.
- [x] Verified full regression suite passes cleanly (`test:models`: 15/15, `test:auth`: 25/25, `test:lost`: 50/50, `test:found`: 62/62, `test:claims`: 50/50).
- [x] Updated `docs/test-log.md` with CLM-01 to CLM-08, INV-1 to INV-3, CLM-07, and DASH-01 entries.



