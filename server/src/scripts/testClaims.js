import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../app.js';
import { env } from '../config/env.js';
import { LostItem } from '../models/LostItem.js';
import { FoundItem } from '../models/FoundItem.js';
import { ClaimRequest } from '../models/ClaimRequest.js';
import { getTodayInCampus } from '../validators/common.js';

async function runClaimTests() {
  console.log('--- RUNNING GATE 5C: CLAIMS, WORKFLOW, INVARIANTS & FAIL_WRITE TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  // Setup test environment variables
  process.env.NODE_ENV = 'test';
  env.NODE_ENV = 'test';
  env.JWT_SECRET = 'test_jwt_secret_key_minimum_32_characters_long_for_security';
  env.JWT_EXPIRES_IN = '1h';
  const staffToken = jwt.sign({ username: 'admin', role: 'staff' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
  const studentToken = jwt.sign(
    { id: new mongoose.Types.ObjectId().toString(), email: 'student@campus.fake', role: 'student' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );


  // Ephemeral test HTTP server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/claims`;
  const dashboardUrl = `http://localhost:${port}/api/dashboard`;
  const foundUrl = `http://localhost:${port}/api/found-items`;

  // Test Database Isolation: In-memory store (TD-1 to TD-6 isolation)
  const isDbConnected = mongoose.connection.readyState === 1;
  const lostStore = new Map();
  const foundStore = new Map();
  const claimStore = new Map();

  let originalLost = {};
  let originalFound = {};
  let originalClaim = {};

  if (!isDbConnected) {
    console.log('[Test Setup] Operating with isolated in-memory model driver (TD-1 to TD-6 isolation).');

    originalLost = {
      create: LostItem.create,
      countDocuments: LostItem.countDocuments
    };

    originalFound = {
      create: FoundItem.create,
      find: FoundItem.find,
      findById: FoundItem.findById,
      findByIdAndUpdate: FoundItem.findByIdAndUpdate,
      findByIdAndDelete: FoundItem.findByIdAndDelete,
      countDocuments: FoundItem.countDocuments
    };

    originalClaim = {
      create: ClaimRequest.create,
      find: ClaimRequest.find,
      findOne: ClaimRequest.findOne,
      findById: ClaimRequest.findById,
      findByIdAndUpdate: ClaimRequest.findByIdAndUpdate,
      findByIdAndDelete: ClaimRequest.findByIdAndDelete,
      countDocuments: ClaimRequest.countDocuments
    };

    // Mock LostItem
    LostItem.create = async (doc) => {
      const id = new mongoose.Types.ObjectId().toString();
      const saved = { _id: id, ...doc, createdAt: new Date().toISOString() };
      lostStore.set(id, saved);
      return saved;
    };
    LostItem.countDocuments = async (filter = {}) => {
      let items = Array.from(lostStore.values());
      if (filter.status) items = items.filter((i) => i.status === filter.status);
      return items.length;
    };

    // Mock FoundItem
    FoundItem.create = async (doc) => {
      const id = new mongoose.Types.ObjectId().toString();
      const saved = { _id: id, ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __v: 0 };
      foundStore.set(id, saved);
      return saved;
    };
    FoundItem.findById = (id) => {
      const item = foundStore.get(String(id));
      let selectedFields = null;
      const chain = {
        select: (fields) => {
          selectedFields = fields.split(' ');
          return chain;
        },
        exec: async () => {
          if (!item) return null;
          if (selectedFields) {
            const projected = {};
            selectedFields.forEach((f) => {
              if (item[f] !== undefined) projected[f] = item[f];
            });
            return projected;
          }
          return { ...item };
        },
        then: (resolve, reject) => chain.exec().then(resolve, reject)
      };
      return chain;
    };
    FoundItem.findByIdAndUpdate = async (id, updateData) => {
      const item = foundStore.get(String(id));
      if (!item) return null;
      const updated = { ...item, ...updateData, updatedAt: new Date().toISOString() };
      foundStore.set(String(id), updated);
      return updated;
    };
    FoundItem.findByIdAndDelete = async (id) => {
      const item = foundStore.get(String(id));
      if (!item) return null;
      foundStore.delete(String(id));
      return item;
    };
    FoundItem.countDocuments = async (filter = {}) => {
      let items = Array.from(foundStore.values());
      if (filter.status) items = items.filter((i) => i.status === filter.status);
      return items.length;
    };

    // Mock ClaimRequest
    ClaimRequest.create = async (doc) => {
      const id = new mongoose.Types.ObjectId().toString();
      const saved = { _id: id, ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __v: 0 };
      claimStore.set(id, saved);
      return saved;
    };
    ClaimRequest.findOne = async (filter = {}) => {
      const items = Array.from(claimStore.values());
      return items.find((c) => {
        if (filter.foundItem && String(c.foundItem) !== String(filter.foundItem)) return false;
        if (filter.claimantEmail && c.claimantEmail.toLowerCase() !== filter.claimantEmail.toLowerCase()) return false;
        if (filter.status && filter.status.$in) {
          if (!filter.status.$in.includes(c.status)) return false;
        } else if (filter.status && c.status !== filter.status) {
          return false;
        }
        return true;
      }) || null;
    };
    ClaimRequest.find = (filter = {}) => {
      let results = Array.from(claimStore.values());
      if (filter.foundItem) {
        results = results.filter((c) => String(c.foundItem) === String(filter.foundItem));
      }
      if (filter.status) {
        results = results.filter((c) => c.status === filter.status);
      }
      if (filter.$or) {
        const regexes = filter.$or.map((cond) => {
          const key = Object.keys(cond)[0];
          return { key, re: new RegExp(cond[key].$regex, cond[key].$options) };
        });
        results = results.filter((r) => regexes.some(({ key, re }) => re.test(r[key] || '')));
      }

      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      let skipVal = 0;
      let limitVal = results.length;

      const chain = {
        populate: () => chain,
        sort: () => chain,
        skip: (s) => {
          skipVal = s;
          return chain;
        },
        limit: (l) => {
          limitVal = l;
          return chain;
        },
        exec: async () => {
          return results.slice(skipVal, skipVal + limitVal);
        },
        then: (resolve, reject) => chain.exec().then(resolve, reject)
      };
      return chain;
    };
    ClaimRequest.findById = (id) => {
      const item = claimStore.get(String(id));
      const chain = {
        populate: () => chain,
        exec: async () => (item ? { ...item } : null),
        then: (resolve, reject) => chain.exec().then(resolve, reject)
      };
      return chain;
    };
    ClaimRequest.findByIdAndUpdate = async (id, updateData) => {
      const item = claimStore.get(String(id));
      if (!item) return null;
      const updated = { ...item, ...updateData, updatedAt: new Date().toISOString() };
      claimStore.set(String(id), updated);
      return updated;
    };
    ClaimRequest.findByIdAndDelete = async (id) => {
      const item = claimStore.get(String(id));
      if (!item) return null;
      claimStore.delete(String(id));
      return item;
    };
    ClaimRequest.countDocuments = async (filter = {}) => {
      let items = Array.from(claimStore.values());
      if (filter.foundItem) items = items.filter((c) => String(c.foundItem) === String(filter.foundItem));
      if (filter.status) items = items.filter((c) => c.status === filter.status);
      return items.length;
    };
  }

  try {
    const today = getTodayInCampus();

    // Setup an initial available FoundItem for testing claims
    const testFoundItem = await FoundItem.create({
      title: 'Sony Wireless Headphones',
      category: 'Electronics',
      description: 'Found black over-ear headphones in the library study lounge.',
      foundLocation: 'Library Lounge',
      dateFound: today,
      status: 'available',
      storageLocation: 'Vault Locker 101',
      finderName: 'Officer Sarah',
      finderEmail: 'sarah.officer@campus.fake',
      finderPhone: '+92 300 1122334',
      verificationNotes: 'Small nick on right cushion'
    });
    const foundItemId = String(testFoundItem._id);

    // -------------------------------------------------------------
    // CLM-01: Create valid claim request (Public, POST /api/claims)
    // -------------------------------------------------------------
    const validClaimData = {
      foundItem: foundItemId,
      claimantName: 'David Student',
      claimantEmail: 'david.student@campus.fake',
      claimantPhone: '+92 333 4455667',
      proofDescription: 'I left them on the wooden table next to the window. Bluetooth name is David-Sony-1000.'
    };

    const resCLM01 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify(validClaimData)
    });
    const bodyCLM01 = await resCLM01.json();
    assert(resCLM01.status === 201, 'CLM-01: Create claim returns 201 Created');
    assert(bodyCLM01.success === true, 'CLM-01: Response has success: true');
    assert(bodyCLM01.data?.status === 'pending', 'CLM-01: New claim defaults to status "pending"');
    assert(bodyCLM01.data?.claimantName === 'David Student', 'CLM-01: Data includes claimantName');
    assert(Boolean(bodyCLM01.data?._id), 'CLM-01: Response includes generated _id');
    const claim1Id = String(bodyCLM01.data?._id);

    // Verify supplied status is ignored
    const resCLM01Status = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        ...validClaimData,
        claimantEmail: 'another.student@campus.fake',
        status: 'approved'
      })
    });
    const bodyCLM01Status = await resCLM01Status.json();
    assert(bodyCLM01Status.data?.status === 'pending', 'CLM-01: Client-supplied status is ignored; defaults to pending');
    const claim2Id = String(bodyCLM01Status.data?._id);

    // -------------------------------------------------------------
    // CLM-02: Input validation on claim creation (400 / 404)
    // -------------------------------------------------------------
    // Bad body (short name, short proof, bad email)
    const resBadBody = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        foundItem: foundItemId,
        claimantName: 'D', // < 2 chars
        claimantEmail: 'not-an-email',
        proofDescription: 'Too short' // < 20 chars
      })
    });
    const bodyBadBody = await resBadBody.json();
    assert(resBadBody.status === 400, 'CLM-02: Invalid fields return 400 Bad Request');
    assert(bodyBadBody.errors && bodyBadBody.errors.length >= 3, 'CLM-02: Returns per-field validation error list');

    // Non-existent foundItem ID
    const randomId = new mongoose.Types.ObjectId().toString();
    const resNonExistentItem = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        ...validClaimData,
        foundItem: randomId,
        claimantEmail: 'unique.user@campus.fake'
      })
    });
    assert(resNonExistentItem.status === 404, 'CLM-02: Non-existent found item returns 404');

    // -------------------------------------------------------------
    // CLM-03: Duplicate active claim prevention (409 Conflict)
    // -------------------------------------------------------------
    // David already has a pending claim on foundItemId
    const resDuplicateClaim = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify(validClaimData)
    });
    const bodyDuplicateClaim = await resDuplicateClaim.json();
    assert(resDuplicateClaim.status === 409, 'CLM-03: Duplicate active claim on same item returns 409 Conflict');
    assert(bodyDuplicateClaim.message.includes('active claim'), 'CLM-03: Response explains active claim constraint');

    // -------------------------------------------------------------
    // CLM-04: Staff listing and details (GET /api/claims)
    // -------------------------------------------------------------
    // Anonymous request rejected with 401
    const resAnonList = await fetch(baseUrl);
    assert(resAnonList.status === 401, 'CLM-04: Anonymous list claims rejected with 401');

    // Staff list returns 200 with meta
    const resStaffList = await fetch(`${baseUrl}?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyStaffList = await resStaffList.json();
    assert(resStaffList.status === 200, 'CLM-04: Staff list returns 200 OK');
    assert(bodyStaffList.meta?.page === 1, 'CLM-04: Meta reflects page 1');
    assert(bodyStaffList.meta?.total >= 2, 'CLM-04: Meta reflects total claims');

    // Staff detail returns full claim
    const resStaffDetail = await fetch(`${baseUrl}/${claim1Id}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyStaffDetail = await resStaffDetail.json();
    assert(resStaffDetail.status === 200, 'CLM-04: Staff detail returns 200 OK');
    assert(bodyStaffDetail.data?.claimantEmail === 'david.student@campus.fake', 'CLM-04: Detail includes claimant email');

    // Malformed ID returns 400
    const resBadId = await fetch(`${baseUrl}/badid123`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(resBadId.status === 400, 'CLM-04: Malformed claim ID returns 400 Invalid ID format');

    // Non-existent ID returns 404
    const resNonExistentClaim = await fetch(`${baseUrl}/${randomId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(resNonExistentClaim.status === 404, 'CLM-04: Well-formed non-existent claim ID returns 404');

    // -------------------------------------------------------------
    // CLM-05 & CLM-06: Workflow transitions, conditional note & invariants (INV-1, INV-2, INV-3)
    // -------------------------------------------------------------
    // 1. Invalid transition (pending -> completed) rejected with 400
    const resInvalidTrans = await fetch(`${baseUrl}/${claim1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'completed' })
    });
    assert(resInvalidTrans.status === 400, 'CLM-05: Direct transition pending -> completed rejected with 400');

    // 2. Rejecting a claim without required adminNote (>= 5 chars) returns 400
    const resRejectNoNote = await fetch(`${baseUrl}/${claim2Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'rejected', adminNote: 'No' }) // < 5 chars
    });
    assert(resRejectNoNote.status === 400, 'CLM-05: Rejecting claim with adminNote < 5 chars rejected with 400');

    // 3. Valid pending -> rejected with valid adminNote
    const resRejectValid = await fetch(`${baseUrl}/${claim2Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        status: 'rejected',
        adminNote: 'Proof did not match the item specifications and serial number.'
      })
    });
    const bodyRejectValid = await resRejectValid.json();
    assert(resRejectValid.status === 200, 'CLM-05: Rejecting claim with valid note returns 200 OK');
    assert(bodyRejectValid.data?.status === 'rejected', 'CLM-05: Claim status updated to "rejected"');

    // After rejection, the claimant can re-submit a new claim (CLM-03 verification)
    const resResubmitAfterReject = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        foundItem: foundItemId,
        claimantName: 'Another Student',
        claimantEmail: 'another.student@campus.fake',
        claimantPhone: '+92 333 9988776',
        proofDescription: 'Here is revised proof with photo of receipt and matching warranty card.'
      })
    });

    assert(resResubmitAfterReject.status === 201, 'CLM-03: Claimant with previously rejected claim can submit a new claim');
    const claim3Id = (await resResubmitAfterReject.json()).data?._id;

    // 4. Valid pending -> approved (INV-1: FoundItem becomes 'claimed')
    const resApprove = await fetch(`${baseUrl}/${claim1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        adminNote: 'Verified Bluetooth pairing name matches student phone.'
      })
    });
    const bodyApprove = await resApprove.json();
    assert(resApprove.status === 200, 'CLM-05: Approve claim returns 200 OK');
    assert(bodyApprove.data?.status === 'approved', 'CLM-05: Claim status updated to "approved"');

    // Verify INV-1: FoundItem status changed to 'claimed'
    const resFoundAfterApprove = await fetch(`${foundUrl}/${foundItemId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyFoundAfterApprove = await resFoundAfterApprove.json();
    assert(bodyFoundAfterApprove.data?.status === 'claimed', 'INV-1: FoundItem status transitioned to "claimed" upon claim approval');

    // Attempting to approve a second claim on the now claimed item is blocked (INV-1 guard)
    const resApproveSecond = await fetch(`${baseUrl}/${claim3Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    assert(resApproveSecond.status === 400, 'INV-1: Cannot approve a second claim for an item that is already claimed');

    // 5. Valid approved -> completed (INV-2: FoundItem becomes 'returned')
    const resComplete = await fetch(`${baseUrl}/${claim1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        status: 'completed',
        adminNote: 'Item handed over to student in campus security office.'
      })
    });
    const bodyComplete = await resComplete.json();
    assert(resComplete.status === 200, 'CLM-05: Complete claim returns 200 OK');
    assert(bodyComplete.data?.status === 'completed', 'CLM-05: Claim status updated to "completed"');

    // Verify INV-2: FoundItem status changed to 'returned'
    const resFoundAfterComplete = await fetch(`${foundUrl}/${foundItemId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyFoundAfterComplete = await resFoundAfterComplete.json();
    assert(bodyFoundAfterComplete.data?.status === 'returned', 'INV-2: FoundItem status transitioned to "returned" upon claim completion');

    // 6. Terminal status check: cannot change status from 'completed' or 'rejected'
    const resChangeFromCompleted = await fetch(`${baseUrl}/${claim1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    assert(resChangeFromCompleted.status === 400, 'CLM-05: Terminal completed status cannot be transitioned');

    // -------------------------------------------------------------
    // CLM-07: Two-Write Failure & Compensating Recovery (FAIL_WRITE test switch)
    // -------------------------------------------------------------
    // Setup a new fresh available FoundItem and a pending Claim
    const testRecoveryItem = await FoundItem.create({
      title: 'Graphing Calculator TI-84',
      category: 'Electronics',
      description: 'Black graphing calculator with yellow battery sliding cover.',
      foundLocation: 'Math Lab 102',
      dateFound: today,
      status: 'available',
      storageLocation: 'Vault 202',
      finderName: 'Math TA Alex',
      finderEmail: 'alex.ta@campus.fake'
    });
    const recoveryItemId = String(testRecoveryItem._id);

    const testRecoveryClaim = await ClaimRequest.create({
      foundItem: recoveryItemId,
      claimantName: 'Emma Watson',
      claimantEmail: 'emma.w@campus.fake',
      proofDescription: 'Yellow battery cover with initial EW carved inside battery bay.',
      status: 'pending',
      adminNote: ''
    });
    const recoveryClaimId = String(testRecoveryClaim._id);

    // Turn ON FAIL_WRITE test switch
    process.env.FAIL_WRITE = 'true';

    const resFailWrite = await fetch(`${baseUrl}/${recoveryClaimId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        adminNote: 'Verified initials EW in battery compartment.'
      })
    });
    const bodyFailWrite = await resFailWrite.json();
    assert(resFailWrite.status === 500, 'CLM-07: FAIL_WRITE triggers HTTP 500 error during simulated second write failure');
    assert(bodyFailWrite.recovered === true, 'CLM-07: Response confirms compensating transaction was executed');

    // Verify Compensating Transaction: Claim MUST have rolled back to 'pending'
    const resClaimRollback = await fetch(`${baseUrl}/${recoveryClaimId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyClaimRollback = await resClaimRollback.json();
    assert(bodyClaimRollback.data?.status === 'pending', 'CLM-07: Compensating recovery successfully restored claim status to "pending"');

    // Verify Invariant: FoundItem MUST remain 'available'
    const resFoundRollback = await fetch(`${foundUrl}/${recoveryItemId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyFoundRollback = await resFoundRollback.json();
    assert(bodyFoundRollback.data?.status === 'available', 'CLM-07: Invariant preserved: FoundItem remained "available"');

    // Turn OFF FAIL_WRITE and verify normal operation succeeds
    delete process.env.FAIL_WRITE;

    const resNormalAfterRecover = await fetch(`${baseUrl}/${recoveryClaimId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        adminNote: 'Verified initials EW in battery compartment.'
      })
    });
    assert(resNormalAfterRecover.status === 200, 'CLM-07: Transition succeeds normally after turning off FAIL_WRITE');

    // -------------------------------------------------------------
    // CLM-08: Claim deletion protections
    // -------------------------------------------------------------
    // 1. Anonymous delete rejected with 401
    const resAnonDelete = await fetch(`${baseUrl}/${recoveryClaimId}`, { method: 'DELETE' });
    assert(resAnonDelete.status === 401, 'CLM-08: Anonymous delete rejected with 401');

    // 2. Deleting completed claim rejected with 400
    const resDeleteCompleted = await fetch(`${baseUrl}/${claim1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(resDeleteCompleted.status === 400, 'CLM-08: Deleting completed claim rejected with 400');

    // 3. Deleting approved claim reverts FoundItem to available (INV-3)
    const resDeleteApproved = await fetch(`${baseUrl}/${recoveryClaimId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(resDeleteApproved.status === 200, 'CLM-08: Deleting approved claim returns 200 OK');

    const resItemAfterClaimDelete = await fetch(`${foundUrl}/${recoveryItemId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyItemAfterClaimDelete = await resItemAfterClaimDelete.json();
    assert(bodyItemAfterClaimDelete.data?.status === 'available', 'INV-3: FoundItem reverted to "available" after approved claim deleted');

    // -------------------------------------------------------------
    // DASH-01: Dashboard Summary Endpoint (GET /api/dashboard)
    // -------------------------------------------------------------
    // Create a LostItem to test lost counts
    await LostItem.create({
      title: 'Lost Campus Card',
      category: 'ID Card',
      description: 'Lost card near entrance',
      lastSeenLocation: 'Gate 1',
      dateLost: today,
      status: 'open',
      reporterName: 'Student X',
      reporterEmail: 'x@campus.fake'
    });

    const resDash = await fetch(dashboardUrl);
    const bodyDash = await resDash.json();
    assert(resDash.status === 200, 'DASH-01: GET /api/dashboard returns 200 OK');
    assert(bodyDash.success === true, 'DASH-01: Response has success: true');
    assert(bodyDash.data?.lost?.total >= 1, 'DASH-01: Lost items total count present');
    assert(bodyDash.data?.found?.total >= 2, 'DASH-01: Found items total count present');
    assert(bodyDash.data?.claims?.total >= 2, 'DASH-01: Claims total count present');
    assert(typeof bodyDash.data?.claims?.pending === 'number', 'DASH-01: Claims pending count present');
    assert(typeof bodyDash.data?.claims?.completed === 'number', 'DASH-01: Claims completed count present');

    // Test /api/dashboard/stats alias
    const resDashStats = await fetch(`${dashboardUrl}/stats`);
    assert(resDashStats.status === 200, 'DASH-01: GET /api/dashboard/stats returns 200 OK');

    // Test /api/dashboard/summary alias
    const resDashSummary = await fetch(`${dashboardUrl}/summary`);
    assert(resDashSummary.status === 200, 'DASH-01: GET /api/dashboard/summary returns 200 OK');

  } finally {
    // Restore mocks if used
    if (!isDbConnected && originalLost.create) {
      LostItem.create = originalLost.create;
      LostItem.countDocuments = originalLost.countDocuments;
    }
    if (!isDbConnected && originalFound.create) {
      FoundItem.create = originalFound.create;
      FoundItem.find = originalFound.find;
      FoundItem.findById = originalFound.findById;
      FoundItem.findByIdAndUpdate = originalFound.findByIdAndUpdate;
      FoundItem.findByIdAndDelete = originalFound.findByIdAndDelete;
      FoundItem.countDocuments = originalFound.countDocuments;
    }
    if (!isDbConnected && originalClaim.create) {
      ClaimRequest.create = originalClaim.create;
      ClaimRequest.find = originalClaim.find;
      ClaimRequest.findOne = originalClaim.findOne;
      ClaimRequest.findById = originalClaim.findById;
      ClaimRequest.findByIdAndUpdate = originalClaim.findByIdAndUpdate;
      ClaimRequest.findByIdAndDelete = originalClaim.findByIdAndDelete;
      ClaimRequest.countDocuments = originalClaim.countDocuments;
    }
    delete process.env.FAIL_WRITE;

    if (server.closeAllConnections) {
      server.closeAllConnections();
    }
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`\nGate 5C Test Results: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  }
}

runClaimTests();
