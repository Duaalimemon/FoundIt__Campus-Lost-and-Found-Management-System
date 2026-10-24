import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../app.js';
import { env } from '../config/env.js';
import { LostItem } from '../models/LostItem.js';
import { FoundItem } from '../models/FoundItem.js';
import { ClaimRequest } from '../models/ClaimRequest.js';
import { getTodayInCampus } from '../validators/common.js';

async function runLifecycleTests() {
  console.log('--- RUNNING PHASE 6: END-TO-END LIFECYCLE & INVARIANT INTEGRATION TESTS ---');
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

  // Ensure test mode
  process.env.NODE_ENV = 'test';
  env.NODE_ENV = 'test';
  env.JWT_SECRET = 'test_jwt_secret_key_minimum_32_characters_long_for_security';
  env.JWT_EXPIRES_IN = '1h';
  const staffToken = jwt.sign({ username: 'admin', role: 'staff' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });

  // Ephemeral test HTTP server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const lostUrl = `http://localhost:${port}/api/lost-items`;
  const foundUrl = `http://localhost:${port}/api/found-items`;
  const claimsUrl = `http://localhost:${port}/api/claims`;
  const dashboardUrl = `http://localhost:${port}/api/dashboard`;

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
      find: LostItem.find,
      findById: LostItem.findById,
      findByIdAndUpdate: LostItem.findByIdAndUpdate,
      findByIdAndDelete: LostItem.findByIdAndDelete,
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
      const saved = { _id: id, ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __v: 0 };
      lostStore.set(id, saved);
      return saved;
    };
    LostItem.find = (filter = {}) => {
      let results = Array.from(lostStore.values());
      if (filter.status) results = results.filter((r) => r.status === filter.status);
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      let selectedFields = null;
      let skipVal = 0;
      let limitVal = results.length;
      const chain = {
        sort: () => chain,
        skip: (s) => { skipVal = s; return chain; },
        limit: (l) => { limitVal = l; return chain; },
        select: (fields) => { selectedFields = fields.split(' '); return chain; },
        exec: async () => {
          const slice = results.slice(skipVal, skipVal + limitVal);
          if (selectedFields) {
            return slice.map((item) => {
              const proj = {};
              selectedFields.forEach((f) => { if (item[f] !== undefined) proj[f] = item[f]; });
              return proj;
            });
          }
          return slice;
        },
        then: (resolve, reject) => chain.exec().then(resolve, reject)
      };
      return chain;
    };
    LostItem.findById = (id) => {
      const item = lostStore.get(String(id));
      let selectedFields = null;
      const chain = {
        select: (fields) => { selectedFields = fields.split(' '); return chain; },
        exec: async () => {
          if (!item) return null;
          if (selectedFields) {
            const proj = {};
            selectedFields.forEach((f) => { if (item[f] !== undefined) proj[f] = item[f]; });
            return proj;
          }
          return { ...item };
        },
        then: (resolve, reject) => chain.exec().then(resolve, reject)
      };
      return chain;
    };
    LostItem.findByIdAndUpdate = async (id, updateData) => {
      const item = lostStore.get(String(id));
      if (!item) return null;
      const updated = { ...item, ...updateData, updatedAt: new Date().toISOString() };
      lostStore.set(String(id), updated);
      return updated;
    };
    LostItem.findByIdAndDelete = async (id) => {
      const item = lostStore.get(String(id));
      if (!item) return null;
      lostStore.delete(String(id));
      return item;
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
    FoundItem.find = (filter = {}) => {
      let results = Array.from(foundStore.values());
      if (filter.status) results = results.filter((r) => r.status === filter.status);
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      let selectedFields = null;
      let skipVal = 0;
      let limitVal = results.length;
      const chain = {
        sort: () => chain,
        skip: (s) => { skipVal = s; return chain; },
        limit: (l) => { limitVal = l; return chain; },
        select: (fields) => { selectedFields = fields.split(' '); return chain; },
        exec: async () => {
          const slice = results.slice(skipVal, skipVal + limitVal);
          if (selectedFields) {
            return slice.map((item) => {
              const proj = {};
              selectedFields.forEach((f) => { if (item[f] !== undefined) proj[f] = item[f]; });
              return proj;
            });
          }
          return slice;
        },
        then: (resolve, reject) => chain.exec().then(resolve, reject)
      };
      return chain;
    };
    FoundItem.findById = (id) => {
      const item = foundStore.get(String(id));
      let selectedFields = null;
      const chain = {
        select: (fields) => { selectedFields = fields.split(' '); return chain; },
        exec: async () => {
          if (!item) return null;
          if (selectedFields) {
            const proj = {};
            selectedFields.forEach((f) => { if (item[f] !== undefined) proj[f] = item[f]; });
            return proj;
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
      if (filter.foundItem) results = results.filter((c) => String(c.foundItem) === String(filter.foundItem));
      if (filter.status) results = results.filter((c) => c.status === filter.status);
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      let skipVal = 0;
      let limitVal = results.length;
      const chain = {
        populate: () => chain,
        sort: () => chain,
        skip: (s) => { skipVal = s; return chain; },
        limit: (l) => { limitVal = l; return chain; },
        exec: async () => results.slice(skipVal, skipVal + limitVal),
        then: (resolve, reject) => chain.exec().then(resolve, reject)
      };
      return chain;
    };
    ClaimRequest.findById = (id) => {
      const claim = claimStore.get(String(id));
      const chain = {
        populate: () => chain,
        exec: async () => (claim ? { ...claim } : null),
        then: (resolve, reject) => chain.exec().then(resolve, reject)
      };
      return chain;
    };
    ClaimRequest.findByIdAndUpdate = async (id, updateData) => {
      const claim = claimStore.get(String(id));
      if (!claim) return null;
      const updated = { ...claim, ...updateData, updatedAt: new Date().toISOString() };
      claimStore.set(String(id), updated);
      return updated;
    };
    ClaimRequest.findByIdAndDelete = async (id) => {
      const claim = claimStore.get(String(id));
      if (!claim) return null;
      claimStore.delete(String(id));
      return claim;
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

    // =========================================================================
    // STAGE 1: LOST ITEM LIFECYCLE & PRIVACY PROJECTIONS
    // =========================================================================
    console.log('\n--- STAGE 1: Lost Item Lifecycle & Dual-Audience Projections ---');

    const validLostData = {
      title: 'Blue HydroFlask Water Bottle',
      category: 'Other',
      description: 'Lost near the campus cafeteria with multiple stickers on it.',
      lastSeenLocation: 'Cafeteria Main Hall',
      dateLost: today,
      reporterName: 'Alice Johnson',
      reporterEmail: 'alice.johnson@campus.edu',
      reporterPhone: '+92 300 1234567'
    };

    // LC-01: Public reporter creates Lost Item
    const resLostCreate = await fetch(lostUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validLostData)
    });
    const rawLostText = await resLostCreate.text();
    const bodyLostCreate = JSON.parse(rawLostText);
    const lostId = bodyLostCreate.data?._id;

    assert(
      resLostCreate.status === 201 && bodyLostCreate.success === true && lostId && bodyLostCreate.data.status === 'open',
      'LC-01: Public Lost Item create returns 201 with default status open and generated _id'
    );

    // LC-02: Public response privacy check (Section 6.5)
    assert(
      !rawLostText.includes('reporterName') &&
      !rawLostText.includes('reporterEmail') &&
      !rawLostText.includes('reporterPhone') &&
      !rawLostText.includes('Alice Johnson') &&
      !rawLostText.includes('alice.johnson@campus.edu') &&
      !rawLostText.includes('__v') &&
      !rawLostText.includes('updatedAt'),
      'LC-02: Public Lost Item create response strictly hides reporter contact details, __v, and updatedAt'
    );

    // LC-03: Staff detail retrieval (with JWT)
    const resLostStaff = await fetch(`${lostUrl}/${lostId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyLostStaff = await resLostStaff.json();
    assert(
      resLostStaff.status === 200 &&
      bodyLostStaff.data.reporterName === 'Alice Johnson' &&
      bodyLostStaff.data.reporterEmail === 'alice.johnson@campus.edu' &&
      bodyLostStaff.data.reporterPhone === '+92 300 1234567',
      'LC-03: Staff Lost Item detail query returns full reporter contact details'
    );

    // LC-04: Anonymous detail retrieval (without JWT)
    const resLostAnon = await fetch(`${lostUrl}/${lostId}`);
    const rawLostAnonText = await resLostAnon.text();
    const bodyLostAnon = JSON.parse(rawLostAnonText);
    assert(
      resLostAnon.status === 200 &&
      bodyLostAnon.data.reporterName === undefined &&
      bodyLostAnon.data.reporterEmail === undefined &&
      !rawLostAnonText.includes('Alice Johnson') &&
      !rawLostAnonText.includes('alice.johnson@campus.edu'),
      'LC-04: Anonymous Lost Item detail query strictly excludes reporter contact information'
    );

    // LC-05: Staff updates status from 'open' to 'resolved'
    const resLostUpdate = await fetch(`${lostUrl}/${lostId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        ...validLostData,
        status: 'resolved'
      })
    });
    const bodyLostUpdate = await resLostUpdate.json();
    assert(
      resLostUpdate.status === 200 && bodyLostUpdate.data.status === 'resolved',
      'LC-05: Staff updates Lost Item status from open to resolved'
    );

    // =========================================================================
    // STAGE 2: FOUND ITEM LIFECYCLE & PRIVACY PROJECTIONS
    // =========================================================================
    console.log('\n--- STAGE 2: Found Item Lifecycle & Privacy Projections ---');

    // LC-06: Finder creates Found Item
    const resFoundCreate = await fetch(foundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Casio Scientific Calculator FX-991EX',
        category: 'Electronics',
        description: 'Black scientific calculator left behind on desk row 4.',
        foundLocation: 'Science Building Room 204',
        dateFound: today,
        storageLocation: 'Security Office Locker B-12',
        finderName: 'Bob Smith',
        finderEmail: 'bob.smith@campus.edu',
        finderPhone: '+92 321 7654321',
        verificationNotes: 'Has an engraved initial BS on the back cover.'
      })
    });
    const rawFoundText = await resFoundCreate.text();
    const bodyFoundCreate = JSON.parse(rawFoundText);
    const foundId = bodyFoundCreate.data?._id;

    assert(
      resFoundCreate.status === 201 && bodyFoundCreate.success === true && foundId && bodyFoundCreate.data.status === 'available',
      'LC-06: Public Found Item create returns 201 with default status available and generated _id'
    );

    // LC-07: Public response privacy check (Section 6.5)
    assert(
      !rawFoundText.includes('storageLocation') &&
      !rawFoundText.includes('finderName') &&
      !rawFoundText.includes('finderEmail') &&
      !rawFoundText.includes('finderPhone') &&
      !rawFoundText.includes('verificationNotes') &&
      !rawFoundText.includes('Bob Smith') &&
      !rawFoundText.includes('Locker B-12'),
      'LC-07: Public Found Item create response strictly hides storageLocation and finder contact details'
    );

    // LC-08: Staff views found item (with JWT)
    const resFoundStaff = await fetch(`${foundUrl}/${foundId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyFoundStaff = await resFoundStaff.json();
    assert(
      resFoundStaff.status === 200 &&
      bodyFoundStaff.data.storageLocation === 'Security Office Locker B-12' &&
      bodyFoundStaff.data.finderName === 'Bob Smith' &&
      bodyFoundStaff.data.finderEmail === 'bob.smith@campus.edu',
      'LC-08: Staff Found Item detail query returns storageLocation and finder contact details'
    );

    // LC-09: Anonymous views found item (without JWT)
    const resFoundAnon = await fetch(`${foundUrl}/${foundId}`);
    const rawFoundAnonText = await resFoundAnon.text();
    const bodyFoundAnon = JSON.parse(rawFoundAnonText);
    assert(
      resFoundAnon.status === 200 &&
      bodyFoundAnon.data.storageLocation === undefined &&
      bodyFoundAnon.data.finderName === undefined &&
      !rawFoundAnonText.includes('Locker B-12') &&
      !rawFoundAnonText.includes('Bob Smith'),
      'LC-09: Anonymous Found Item detail query strictly excludes storageLocation and finder contact details'
    );

    // =========================================================================
    // STAGE 3: DUPLICATE CLAIM REJECTION & MULTI-CLAIMANT VALIDATION
    // =========================================================================
    console.log('\n--- STAGE 3: Claim Creation & Duplicate Prevention ---');

    // LC-10: Claimant A submits first claim
    const resClaim1 = await fetch(claimsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foundItem: foundId,
        claimantName: 'Dave Miller',
        claimantEmail: 'dave.miller@campus.edu',
        claimantPhone: '+92 333 1112233',
        proofDescription: 'This is my calculator, it has my initials BS from my brother Bob Smith.'
      })
    });
    const bodyClaim1 = await resClaim1.json();
    const claim1Id = bodyClaim1.data?._id;
    assert(
      resClaim1.status === 201 && bodyClaim1.data?.status === 'pending' && claim1Id,
      'LC-10: Claimant A submits first valid claim returning 201 with status pending'
    );

    // LC-11: Claimant A submits duplicate claim while first is pending
    const resClaimDup = await fetch(claimsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foundItem: foundId,
        claimantName: 'Dave Miller',
        claimantEmail: 'dave.miller@campus.edu',
        claimantPhone: '+92 333 1112233',
        proofDescription: 'Submitting duplicate claim to check prevention rules.'
      })
    });
    const bodyClaimDup = await resClaimDup.json();
    assert(
      resClaimDup.status === 409 && bodyClaimDup.success === false,
      'LC-11: Duplicate active claim from same claimant on same item rejected with HTTP 409 Conflict'
    );

    // LC-12: Claimant B submits claim on same available item
    const resClaim2 = await fetch(claimsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foundItem: foundId,
        claimantName: 'Eve Wilson',
        claimantEmail: 'eve.wilson@campus.edu',
        claimantPhone: '+92 344 5556677',
        proofDescription: 'I left my scientific calculator in room 204 yesterday afternoon.'
      })
    });
    const bodyClaim2 = await resClaim2.json();
    const claim2Id = bodyClaim2.data?._id;
    assert(
      resClaim2.status === 201 && bodyClaim2.data?.status === 'pending' && claim2Id,
      'LC-12: Distinct Claimant B submits valid claim on same available item returning 201'
    );

    // =========================================================================
    // STAGE 4: INVARIANT INV-1 & REJECTION NOTE RULES
    // =========================================================================
    console.log('\n--- STAGE 4: Invariant INV-1 & Conditional Rejection Notes ---');

    // LC-13: Staff approves Claim 1
    const resApprove1 = await fetch(`${claimsUrl}/${claim1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    const bodyApprove1 = await resApprove1.json();
    assert(
      resApprove1.status === 200 && bodyApprove1.data.status === 'approved',
      'LC-13: Staff approves Claimant A claim returning 200 with status approved'
    );

    // LC-14: Invariant INV-1 verification
    const resCheckItem1 = await fetch(`${foundUrl}/${foundId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyCheckItem1 = await resCheckItem1.json();
    assert(
      bodyCheckItem1.data.status === 'claimed',
      'LC-14: Invariant INV-1 verified: approving claim transitions FoundItem status to "claimed"'
    );

    // LC-15: Staff attempts to approve Claim 2 while FoundItem is already claimed
    const resApprove2 = await fetch(`${claimsUrl}/${claim2Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    assert(
      resApprove2.status === 400,
      'LC-15: Invariant INV-1 enforced: approving second claim on already claimed item rejected with 400'
    );

    // LC-16: Staff attempts to reject Claim 2 without adminNote
    const resRejectNoNote = await fetch(`${claimsUrl}/${claim2Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'rejected' })
    });
    assert(
      resRejectNoNote.status === 400,
      'LC-16: Rejecting claim without adminNote rejected with HTTP 400'
    );

    // LC-17: Staff attempts to reject Claim 2 with short adminNote (< 5 chars)
    const resRejectShortNote = await fetch(`${claimsUrl}/${claim2Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'rejected', adminNote: 'No' })
    });
    assert(
      resRejectShortNote.status === 400,
      'LC-17: Rejecting claim with adminNote < 5 chars rejected with HTTP 400'
    );

    // LC-18: Staff rejects Claim 2 with valid adminNote (>= 5 chars)
    const resRejectValid = await fetch(`${claimsUrl}/${claim2Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        status: 'rejected',
        adminNote: 'Proof description does not match engraved serial initials.'
      })
    });
    const bodyRejectValid = await resRejectValid.json();
    assert(
      resRejectValid.status === 200 &&
      bodyRejectValid.data.status === 'rejected' &&
      bodyRejectValid.data.adminNote === 'Proof description does not match engraved serial initials.',
      'LC-18: Rejecting claim with valid adminNote >= 5 chars returns 200 with status rejected'
    );

    // =========================================================================
    // STAGE 5: INVARIANT INV-2 & DELETION GUARDS
    // =========================================================================
    console.log('\n--- STAGE 5: Invariant INV-2 & Deletion Protections ---');

    // LC-19: Staff attempts to DELETE FoundItem while referenced by claims (FND-06)
    const resDeleteFoundBlocked = await fetch(`${foundUrl}/${foundId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyDeleteFoundBlocked = await resDeleteFoundBlocked.json();
    assert(
      resDeleteFoundBlocked.status === 409 &&
      bodyDeleteFoundBlocked.success === false &&
      bodyDeleteFoundBlocked.claimCount === 2,
      'LC-19: Deleting FoundItem referenced by claims rejected with HTTP 409 Conflict returning claimCount'
    );

    // LC-20: Staff completes Claim 1
    const resComplete1 = await fetch(`${claimsUrl}/${claim1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'completed' })
    });
    const bodyComplete1 = await resComplete1.json();
    assert(
      resComplete1.status === 200 && bodyComplete1.data.status === 'completed',
      'LC-20: Staff transitions approved claim to completed returning 200'
    );

    // LC-21: Invariant INV-2 verification
    const resCheckItem2 = await fetch(`${foundUrl}/${foundId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyCheckItem2 = await resCheckItem2.json();
    assert(
      bodyCheckItem2.data.status === 'returned',
      'LC-21: Invariant INV-2 verified: completing approved claim transitions FoundItem status to "returned"'
    );

    // LC-22: Staff attempts to edit FoundItem while status is 'returned'
    const resEditReturned = await fetch(`${foundUrl}/${foundId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ description: 'Attempting to edit returned item.' })
    });
    assert(
      resEditReturned.status === 400,
      'LC-22: Editing FoundItem when status is not available rejected with HTTP 400'
    );

    // LC-23: Staff attempts to DELETE completed Claim 1 (CLM-08)
    const resDeleteCompletedClaim = await fetch(`${claimsUrl}/${claim1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(
      resDeleteCompletedClaim.status === 400,
      'LC-23: Deleting completed claim rejected with HTTP 400'
    );

    // =========================================================================
    // STAGE 6: INVARIANT INV-3 (REVERSION TO AVAILABLE)
    // =========================================================================
    console.log('\n--- STAGE 6: Invariant INV-3 (Reversion to Available) ---');

    // Setup item 2 & claim 3 for reject reversion (use valid category 'Book')
    const resItemInv3A = await fetch(foundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Green Notebook Binder',
        category: 'Book',
        description: 'Green binder with handwritten biology lecture notes.',
        foundLocation: 'Biology Lab 101',
        dateFound: today,
        storageLocation: 'Lab Cabinet 3',
        finderName: 'Frank White',
        finderEmail: 'frank.white@campus.edu',
        finderPhone: '+92 300 9988776'
      })
    });
    const itemInv3AId = (await resItemInv3A.json()).data?._id;

    const resClaimInv3A = await fetch(claimsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foundItem: itemInv3AId,
        claimantName: 'Grace Lee',
        claimantEmail: 'grace.lee@campus.edu',
        claimantPhone: '+92 311 2233445',
        proofDescription: 'Contains lecture notes from BIO 101 unit 3 with my name on first page.'
      })
    });
    const claimInv3AId = (await resClaimInv3A.json()).data?._id;

    // Approve claim -> item becomes claimed
    await fetch(`${claimsUrl}/${claimInv3AId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ status: 'approved' })
    });

    // LC-24: Reject approved claim -> item reverts to available (INV-3)
    const resRejectApproved = await fetch(`${claimsUrl}/${claimInv3AId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        status: 'rejected',
        adminNote: 'Claimant realized it was not their binder upon inspection.'
      })
    });
    const itemInv3ACheck = await (await fetch(`${foundUrl}/${itemInv3AId}`, { headers: { Authorization: `Bearer ${staffToken}` } })).json();
    assert(
      resRejectApproved.status === 200 && itemInv3ACheck.data.status === 'available',
      'LC-24: Invariant INV-3 verified: rejecting approved claim reverts FoundItem status to "available"'
    );

    // Setup item 3 & claim 4 for delete reversion
    const resItemInv3B = await fetch(foundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'USB Flash Drive 64GB',
        category: 'Electronics',
        description: 'Silver metal USB drive found in computer lab 3.',
        foundLocation: 'Computer Lab 3',
        dateFound: today,
        storageLocation: 'IT Desk Drawer',
        finderName: 'Helen Davis',
        finderEmail: 'helen.davis@campus.edu',
        finderPhone: '+92 322 4455667'
      })
    });
    const itemInv3BId = (await resItemInv3B.json()).data?._id;

    const resClaimInv3B = await fetch(claimsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foundItem: itemInv3BId,
        claimantName: 'Ian Clark',
        claimantEmail: 'ian.clark@campus.edu',
        claimantPhone: '+92 333 7788990',
        proofDescription: 'Kingston 64GB drive with coursework folders named CS201 and CS202.'
      })
    });
    const claimInv3BId = (await resClaimInv3B.json()).data?._id;

    // Approve claim -> item becomes claimed
    await fetch(`${claimsUrl}/${claimInv3BId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ status: 'approved' })
    });

    // LC-25: Delete approved claim -> item reverts to available (INV-3)
    const resDeleteApprovedClaim = await fetch(`${claimsUrl}/${claimInv3BId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const itemInv3BCheck = await (await fetch(`${foundUrl}/${itemInv3BId}`, { headers: { Authorization: `Bearer ${staffToken}` } })).json();
    assert(
      resDeleteApprovedClaim.status === 200 && itemInv3BCheck.data.status === 'available',
      'LC-25: Invariant INV-3 verified: deleting approved claim reverts FoundItem status to "available"'
    );

    // =========================================================================
    // STAGE 7: TWO-WRITE COMPENSATING FAILURE RECOVERY (FAIL_WRITE)
    // =========================================================================
    console.log('\n--- STAGE 7: Two-Write Compensating Failure Recovery (FAIL_WRITE) ---');

    // Create item & claim for failure simulation
    const resItemFail = await fetch(foundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Leather Wallet Brown',
        category: 'Wallet',
        description: 'Brown leather tri-fold wallet found near library turnstiles.',
        foundLocation: 'Library Entrance',
        dateFound: today,
        storageLocation: 'Library Security Safe',
        finderName: 'Jack Taylor',
        finderEmail: 'jack.taylor@campus.edu',
        finderPhone: '+92 345 1122334'
      })
    });
    const itemFailId = (await resItemFail.json()).data?._id;

    const resClaimFail = await fetch(claimsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foundItem: itemFailId,
        claimantName: 'Karen Moore',
        claimantEmail: 'karen.moore@campus.edu',
        claimantPhone: '+92 355 9988112',
        proofDescription: 'Brown wallet containing my university gym membership card.'
      })
    });
    const claimFailId = (await resClaimFail.json()).data?._id;

    // Trigger transition with FAIL_WRITE switch active
    process.env.FAIL_WRITE = 'true';
    const resFailSim = await fetch(`${claimsUrl}/${claimFailId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    delete process.env.FAIL_WRITE;

    const bodyFailSim = await resFailSim.json();
    const claimFailCheck = await (await fetch(`${claimsUrl}/${claimFailId}`, { headers: { Authorization: `Bearer ${staffToken}` } })).json();
    const itemFailCheck = await (await fetch(`${foundUrl}/${itemFailId}`, { headers: { Authorization: `Bearer ${staffToken}` } })).json();

    // LC-26: Compensating recovery assertion
    assert(
      resFailSim.status === 500 &&
      bodyFailSim.recovered === true &&
      claimFailCheck.data.status === 'pending' &&
      itemFailCheck.data.status === 'available',
      'LC-26: FAIL_WRITE simulated failure triggers compensating rollback: returns 500 { recovered: true }, claim restored to pending, item remains available'
    );

    // =========================================================================
    // STAGE 8: DASHBOARD SUMMARY AGGREGATE METRICS
    // =========================================================================
    console.log('\n--- STAGE 8: Dashboard Summary Aggregate Metrics ---');

    const resDash = await fetch(dashboardUrl, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyDash = await resDash.json();

    const dataDash = bodyDash.data;
    assert(
      resDash.status === 200 &&
      bodyDash.success === true &&
      dataDash.lost &&
      typeof dataDash.lost.total === 'number' &&
      dataDash.found &&
      typeof dataDash.found.total === 'number' &&
      dataDash.claims &&
      typeof dataDash.claims.total === 'number',
      'LC-27: Dashboard summary returns 200 OK with valid aggregate structure across Lost, Found, and Claim records'
    );

  } finally {
    // Restore Mongoose original methods if mocked
    if (!isDbConnected && originalLost.create) {
      LostItem.create = originalLost.create;
      LostItem.find = originalLost.find;
      LostItem.findById = originalLost.findById;
      LostItem.findByIdAndUpdate = originalLost.findByIdAndUpdate;
      LostItem.findByIdAndDelete = originalLost.findByIdAndDelete;
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

  console.log(`\nLifecycle Test Results: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  }
}

runLifecycleTests();
