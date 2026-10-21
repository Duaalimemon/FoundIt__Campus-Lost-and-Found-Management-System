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
- [ ] **Phase 5: Backend CRUD APIs and Claim Workflow**
  - [ ] Gate 5A: LostItem CRUD (Zod schemas including DR-1, 5 endpoints, public vs staff projection, list query)
  - [ ] Gate 5B: FoundItem CRUD (Zod schemas including DR-1, 5 endpoints, edit/delete protections, status immutability)
  - [ ] Gate 5C: ClaimRequest Workflow & Test Failure Switch (two-write recovery, consistency invariants, test-only switch & TD-1 to TD-6 isolation)
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
