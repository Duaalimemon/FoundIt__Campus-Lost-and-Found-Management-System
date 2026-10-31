import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../app.js';
import { env } from '../config/env.js';
import { FoundItem } from '../models/FoundItem.js';
import { ClaimRequest } from '../models/ClaimRequest.js';
import { PUBLIC_FIELDS } from '../constants.js';
import { getTodayInCampus } from '../validators/common.js';

async function runFoundItemTests() {
  console.log('--- RUNNING GATE 5B: FOUNDITEM CRUD TESTS (FND-01 to FND-08) ---');
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

  // Setup test JWT credentials
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
  const baseUrl = `http://localhost:${port}/api/found-items`;

  // In-memory test stores to simulate database operations if offline
  const foundMemoryStore = new Map();
  const claimMemoryStore = new Map();

  const isDbConnected = mongoose.connection.readyState === 1;
  let originalFoundMethods = {};
  let originalClaimMethods = {};

  if (!isDbConnected) {
    console.log('[Test Setup] Operating with isolated in-memory model driver.');

    originalFoundMethods = {
      create: FoundItem.create,
      find: FoundItem.find,
      findById: FoundItem.findById,
      findByIdAndUpdate: FoundItem.findByIdAndUpdate,
      findByIdAndDelete: FoundItem.findByIdAndDelete,
      countDocuments: FoundItem.countDocuments
    };

    originalClaimMethods = {
      create: ClaimRequest.create,
      countDocuments: ClaimRequest.countDocuments
    };

    FoundItem.create = async (doc) => {
      const id = new mongoose.Types.ObjectId().toString();
      const saved = {
        _id: id,
        ...doc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0
      };
      foundMemoryStore.set(id, saved);
      return saved;
    };

    FoundItem.find = (filter = {}) => {
      let results = Array.from(foundMemoryStore.values());

      if (filter.category) {
        results = results.filter((r) => r.category === filter.category);
      }
      if (filter.status) {
        results = results.filter((r) => r.status === filter.status);
      }
      if (filter.$or) {
        const regexes = filter.$or.map((cond) => {
          const key = Object.keys(cond)[0];
          return { key, re: new RegExp(cond[key].$regex, cond[key].$options) };
        });
        results = results.filter((r) => regexes.some(({ key, re }) => re.test(r[key] || '')));
      }
      if (filter.dateFound) {
        if (filter.dateFound.$gte) {
          results = results.filter((r) => new Date(r.dateFound) >= filter.dateFound.$gte);
        }
        if (filter.dateFound.$lte) {
          results = results.filter((r) => new Date(r.dateFound) <= filter.dateFound.$lte);
        }
      }

      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      let selectedFields = null;
      let skipVal = 0;
      let limitVal = results.length;

      const chain = {
        sort: () => chain,
        skip: (s) => {
          skipVal = s;
          return chain;
        },
        limit: (l) => {
          limitVal = l;
          return chain;
        },
        select: (fields) => {
          selectedFields = fields.split(' ');
          return chain;
        },
        exec: async () => {
          const pageSlice = results.slice(skipVal, skipVal + limitVal);
          if (selectedFields) {
            return pageSlice.map((item) => {
              const projected = {};
              selectedFields.forEach((f) => {
                if (item[f] !== undefined) projected[f] = item[f];
              });
              return projected;
            });
          }
          return pageSlice;
        },
        then: (resolve, reject) => chain.exec().then(resolve, reject)
      };
      return chain;
    };

    FoundItem.findById = (id) => {
      const item = foundMemoryStore.get(String(id));
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
      const item = foundMemoryStore.get(String(id));
      if (!item) return null;
      const updated = {
        ...item,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      foundMemoryStore.set(String(id), updated);
      return updated;
    };

    FoundItem.findByIdAndDelete = async (id) => {
      const item = foundMemoryStore.get(String(id));
      if (!item) return null;
      foundMemoryStore.delete(String(id));
      return item;
    };

    FoundItem.countDocuments = async (filter = {}) => {
      return (await FoundItem.find(filter).exec()).length;
    };

    ClaimRequest.countDocuments = async (filter = {}) => {
      let results = Array.from(claimMemoryStore.values());
      if (filter.foundItem) {
        results = results.filter((c) => String(c.foundItem) === String(filter.foundItem));
      }
      return results.length;
    };

    ClaimRequest.create = async (doc) => {
      const id = new mongoose.Types.ObjectId().toString();
      const saved = { _id: id, ...doc };
      claimMemoryStore.set(id, saved);
      return saved;
    };
  }

  try {
    const today = getTodayInCampus();

    // -------------------------------------------------------------
    // FND-01: Create valid found report (Public, POST /api/found-items)
    // -------------------------------------------------------------
    const validReportData = {
      title: 'Found Scientific Calculator',
      category: 'Electronics',
      description: 'Found Casio fx-991EX calculator in Room 302 on the front desk.',
      foundLocation: 'Science Building Room 302',
      dateFound: today,
      storageLocation: 'L&F Locker B-14',
      finderName: 'Bob Student',
      finderEmail: 'bob@campus.fake',
      finderPhone: '+92 300 7654321',
      verificationNotes: 'Has small scratch on the back battery cover'
    };

    const resFND01 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify(validReportData)
    });
    const bodyFND01 = await resFND01.json();
    assert(resFND01.status === 201, 'FND-01: Create returns 201 Created');
    assert(bodyFND01.success === true, 'FND-01: Response has success: true');
    assert(bodyFND01.data?.title === 'Found Scientific Calculator', 'FND-01: Response data holds created title');
    assert(bodyFND01.data?.status === 'available', 'FND-01: New report has default status "available"');
    const createdId = bodyFND01.data?._id;
    assert(Boolean(createdId), 'FND-01: Response includes generated _id');

    // -------------------------------------------------------------
    // FND-02: Input validation on create (400 Bad Request)
    // -------------------------------------------------------------
    const resFND02 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        title: 'AB', // < 3 chars
        category: 'Electronics',
        description: 'Short', // < 10 chars
        foundLocation: 'A', // < 2 chars
        dateFound: today,
        storageLocation: 'S', // < 2 chars
        finderName: 'B', // < 2 chars
        finderEmail: 'not-an-email'
      })
    });
    const bodyFND02 = await resFND02.json();
    assert(resFND02.status === 400, 'FND-02: Invalid body returns 400 Validation failed');
    assert(bodyFND02.errors && bodyFND02.errors.length >= 5, 'FND-02: Returns per-field validation error list');

    // Client-supplied status ignored on create
    const resFND02Status = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        ...validReportData,
        title: 'Report with Injected Status',
        status: 'claimed'
      })
    });
    const bodyFND02Status = await resFND02Status.json();
    assert(bodyFND02Status.data?.status === 'available', 'FND-02: Supplied status is ignored on create; record is available');

    // -------------------------------------------------------------
    // FND-03: List with search, category, status filters & pagination
    // -------------------------------------------------------------
    // Create an extra item for testing category and search
    await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        ...validReportData,
        title: 'Found Engineering Drawing Kit',
        category: 'Other',
        description: 'Black zip pouch containing compass, set squares and drawing pens.'
      })
    });

    const resListAll = await fetch(`${baseUrl}?page=1&limit=10`);
    const bodyListAll = await resListAll.json();
    assert(resListAll.status === 200, 'FND-03: GET /api/found-items returns 200 OK');
    assert(bodyListAll.meta?.page === 1, 'FND-03: Meta reflects page 1');
    assert(bodyListAll.meta?.total >= 2, 'FND-03: Meta reflects total items');

    // Filter by category=Other
    const resListCat = await fetch(`${baseUrl}?category=Other`);
    const bodyListCat = await resListCat.json();
    assert(bodyListCat.data?.every((i) => i.category === 'Other'), 'FND-03: Category filter restricts results');

    // Filter by text search q=Calculator
    const resListQ = await fetch(`${baseUrl}?q=Calculator`);
    const bodyListQ = await resListQ.json();
    assert(
      bodyListQ.data?.length >= 1 &&
        bodyListQ.data.every(
          (i) =>
            i.title.toLowerCase().includes('calculator') ||
            i.description.toLowerCase().includes('calculator')
        ),
      'FND-03: Search query q filters title/description'
    );

    // -------------------------------------------------------------
    // FND-04: Public detail versus staff detail projection
    // -------------------------------------------------------------
    const resPublicDetail = await fetch(`${baseUrl}/${createdId}`);
    const bodyPublicDetail = await resPublicDetail.json();
    assert(resPublicDetail.status === 200, 'FND-04: Public detail returns 200 OK');
    assert(bodyPublicDetail.data?.storageLocation === undefined, 'FND-04: Public detail excludes storageLocation');
    assert(bodyPublicDetail.data?.finderName === undefined, 'FND-04: Public detail excludes finderName');
    assert(bodyPublicDetail.data?.finderEmail === undefined, 'FND-04: Public detail excludes finderEmail');
    assert(bodyPublicDetail.data?.finderPhone === undefined, 'FND-04: Public detail excludes finderPhone');
    assert(bodyPublicDetail.data?.verificationNotes === undefined, 'FND-04: Public detail excludes verificationNotes');

    const resStaffDetail = await fetch(`${baseUrl}/${createdId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyStaffDetail = await resStaffDetail.json();
    assert(resStaffDetail.status === 200, 'FND-04: Staff detail returns 200 OK');
    assert(bodyStaffDetail.data?.storageLocation === 'L&F Locker B-14', 'FND-04: Staff detail includes storageLocation');
    assert(bodyStaffDetail.data?.finderName === 'Bob Student', 'FND-04: Staff detail includes finderName');
    assert(bodyStaffDetail.data?.finderEmail === 'bob@campus.fake', 'FND-04: Staff detail includes finderEmail');
    assert(bodyStaffDetail.data?.verificationNotes === 'Has small scratch on the back battery cover', 'FND-04: Staff detail includes verificationNotes');

    // -------------------------------------------------------------
    // FND-05: Status and edit protections on PUT (Staff only)
    // -------------------------------------------------------------
    // 1. Anonymous PUT returns 401
    const resAnonPut = await fetch(`${baseUrl}/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validReportData)
    });
    assert(resAnonPut.status === 401, 'FND-05: Anonymous update rejected with 401');

    // 2. Staff can edit details while status is 'available'
    const resStaffEdit = await fetch(`${baseUrl}/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        ...validReportData,
        description: 'Updated description: Casio fx-991EX with silver sliding cover.'
      })
    });
    const bodyStaffEdit = await resStaffEdit.json();
    assert(resStaffEdit.status === 200, 'FND-05: Staff edit while available returns 200 OK');
    assert(bodyStaffEdit.data?.description.includes('silver sliding cover'), 'FND-05: Description updated');
    assert(bodyStaffEdit.data?.status === 'available', 'FND-05: Status remains available');

    // 3. Client CANNOT change status through PUT
    const resStatusChangePut = await fetch(`${baseUrl}/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        ...validReportData,
        status: 'claimed'
      })
    });
    assert(resStatusChangePut.status === 400, 'FND-05: Changing status via PUT rejected with 400');

    // 4. Editing rejected if status is not 'available' (e.g. simulated claimed item)
    const claimedItem = await FoundItem.create({
      ...validReportData,
      title: 'Claimed Laptop Charger',
      status: 'claimed'
    });
    // Force status to claimed in memory or DB
    if (!isDbConnected) {
      const stored = foundMemoryStore.get(String(claimedItem._id));
      if (stored) stored.status = 'claimed';
    } else {
      await FoundItem.findByIdAndUpdate(claimedItem._id, { status: 'claimed' });
    }

    const resEditClaimed = await fetch(`${baseUrl}/${claimedItem._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        ...validReportData,
        title: 'Attempted edit on claimed item'
      })
    });
    assert(resEditClaimed.status === 400, 'FND-05: Editing item when status is not available rejected with 400');

    // -------------------------------------------------------------
    // FND-06: Deletion protection when claims reference item
    // -------------------------------------------------------------
    // 1. Anonymous DELETE returns 401
    const resAnonDelete = await fetch(`${baseUrl}/${createdId}`, {
      method: 'DELETE'
    });
    assert(resAnonDelete.status === 401, 'FND-06: Anonymous delete rejected with 401');

    // 2. Item referenced by claim CANNOT be deleted -> 409 Conflict with claimCount
    if (!isDbConnected) {
      claimMemoryStore.set('test_claim_1', {
        _id: 'test_claim_1',
        foundItem: createdId
      });
    } else {
      await ClaimRequest.create({
        foundItem: createdId,
        claimantName: 'Charlie Claimant',
        claimantEmail: 'charlie@campus.fake',
        proofDescription: 'I can describe the exact stickers and serial number on the device'
      });
    }

    const resDeleteWithClaim = await fetch(`${baseUrl}/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyDeleteWithClaim = await resDeleteWithClaim.json();
    assert(resDeleteWithClaim.status === 409, 'FND-06: Delete item with referencing claims returns 409 Conflict');
    assert(bodyDeleteWithClaim.claimCount >= 1, 'FND-06: 409 response includes claimCount');
    assert(bodyDeleteWithClaim.message.includes('claim'), 'FND-06: 409 response explains claim constraint');

    // Item must still exist after rejected deletion
    const resStillExists = await fetch(`${baseUrl}/${createdId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(resStillExists.status === 200, 'FND-06: Item is preserved after 409 rejection');

    // 3. Delete item with NO claims succeeds -> 200 OK
    // Remove the referencing claim
    if (!isDbConnected) {
      claimMemoryStore.delete('test_claim_1');
    } else {
      await ClaimRequest.deleteMany({ foundItem: createdId });
    }

    const resDeleteSuccess = await fetch(`${baseUrl}/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyDeleteSuccess = await resDeleteSuccess.json();
    assert(resDeleteSuccess.status === 200, 'FND-06: Delete item with no claims returns 200 OK');
    assert(bodyDeleteSuccess.data?._id === createdId, 'FND-06: Delete response returns deleted _id');

    // Subsequent GET returns 404
    const resAfterDelete = await fetch(`${baseUrl}/${createdId}`);
    assert(resAfterDelete.status === 404, 'FND-06: Deleted item returns 404 on subsequent get');

    // -------------------------------------------------------------
    // FND-07: Malformed ID (400) vs Unknown ID (404)
    // -------------------------------------------------------------
    const resBadId = await fetch(`${baseUrl}/xyz123`);
    assert(resBadId.status === 400, 'FND-07: Malformed ID parameter returns 400 Invalid ID format');

    const unknownId = new mongoose.Types.ObjectId().toString();
    const resUnknownId = await fetch(`${baseUrl}/${unknownId}`);
    assert(resUnknownId.status === 404, 'FND-07: Well-formed non-existent ID returns 404');

    // -------------------------------------------------------------
    // FND-08: Date rule DR-1 checks & Public create privacy rules (Section 6.5)
    // -------------------------------------------------------------
    // 1. DR-1: Future date rejected
    const now = new Date();
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);
    const resTomorrow = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        ...validReportData,
        dateFound: tomorrowStr
      })
    });
    assert(resTomorrow.status === 400, 'FND-08: DR-1 rejects future date with 400');

    // 2. DR-1: Today accepted
    const resToday = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        ...validReportData,
        title: 'Today Found Report',
        dateFound: today
      })
    });
    assert(resToday.status === 201, 'FND-08: DR-1 accepts today date with 201');

    // 3. DR-1: Past date accepted
    const resOldDate = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        ...validReportData,
        title: 'Historical Found Report',
        dateFound: '2022-05-10'
      })
    });
    assert(resOldDate.status === 201, 'FND-08: DR-1 accepts historical date with 201');

    // 4. DR-1: Impossible calendar date rejected
    const resImpossible = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        ...validReportData,
        dateFound: '2026-02-31'
      })
    });
    assert(resImpossible.status === 400, 'FND-08: DR-1 rejects impossible date (2026-02-31) with 400');

    // 5. Section 6.5 & Gate 8C-D: Public create privacy projection & auth guards
    // Anonymous call must return 401 (Gate 8C-D)
    const resPrivAnon = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validReportData)
    });
    assert(resPrivAnon.status === 401, 'FND-08: Anonymous create returns 401 (Gate 8C-D)');

    // Staff call must return 403 (Gate 8C-D)
    const resPrivStaff = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify(validReportData)
    });
    assert(resPrivStaff.status === 403, 'FND-08: Staff create returns 403 Forbidden (Gate 8C-D)');

    // Authenticated student create: verify privacy projection
    const resPrivStudent = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        ...validReportData,
        title: 'Privacy Verification Test Item',
        storageLocation: 'Vault 99 Shelf Z',
        finderName: 'Confidential Person Alpha',
        finderEmail: 'secretfinder@campus.fake',
        finderPhone: '+92 333 1122334',
        verificationNotes: 'Super secret notes'
      })
    });
    const rawStudentText = await resPrivStudent.text();
    const rawStudentJson = JSON.parse(rawStudentText);
    assert(resPrivStudent.status === 201, 'FND-08: Student create returns 201');
    assert(!rawStudentText.includes('Confidential Person Alpha'), 'FND-08: Response strictly excludes finderName');
    assert(!rawStudentText.includes('secretfinder@campus.fake'), 'FND-08: Response strictly excludes finderEmail');
    assert(!rawStudentText.includes('+92 333 1122334'), 'FND-08: Response strictly excludes finderPhone');
    assert(!rawStudentText.includes('Vault 99 Shelf Z'), 'FND-08: Response strictly excludes storageLocation');
    assert(!rawStudentText.includes('Super secret notes'), 'FND-08: Response strictly excludes verificationNotes');
    assert(rawStudentJson.data?.__v === undefined, 'FND-08: Response excludes __v');
    assert(rawStudentJson.data?.updatedAt === undefined, 'FND-08: Response excludes updatedAt');

    // 7. Validation error does not echo submitted contact details
    const resValErr = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        title: 'AB',
        finderEmail: 'secret_user@campus.fake'
      })
    });
    const rawValErrText = await resValErr.text();
    assert(resValErr.status === 400, 'FND-08: Validation error returns 400');
    assert(!rawValErrText.includes('secret_user@campus.fake'), 'FND-08: Validation error does not echo submitted finder values');

    // -------------------------------------------------------------
    // SEC-05 (part): Public list JSON verification
    // -------------------------------------------------------------
    const resSec05 = await fetch(`${baseUrl}?limit=5`);
    const rawSec05Text = await resSec05.text();
    assert(!rawSec05Text.includes('finderEmail'), 'SEC-05: Public list JSON has zero finderEmail keys');
    assert(!rawSec05Text.includes('storageLocation'), 'SEC-05: Public list JSON has zero storageLocation keys');

    // -------------------------------------------------------------
    // SEC-06 (part): Anonymous search for private value returns no match
    // -------------------------------------------------------------
    const resSec06 = await fetch(`${baseUrl}?q=secretfinder@campus.fake`);
    const bodySec06 = await resSec06.json();
    assert(bodySec06.data?.length === 0, 'SEC-06: Anonymous search for private email returns 0 results');

    // -------------------------------------------------------------
    // SEC-07 (part): NoSQL injection, oversized payload, malformed JSON
    // -------------------------------------------------------------
    const resNoSql = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        title: { $gt: '' },
        category: 'Electronics'
      })
    });
    assert(resNoSql.status === 400, 'SEC-07: { "$gt": "" } payload rejected with 400');

    const resMalformedJson = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"title": "Unclosed string'
    });
    assert(resMalformedJson.status === 400, 'SEC-07: Malformed JSON payload returns 400');

  } finally {
    if (!isDbConnected && originalFoundMethods.create) {
      FoundItem.create = originalFoundMethods.create;
      FoundItem.find = originalFoundMethods.find;
      FoundItem.findById = originalFoundMethods.findById;
      FoundItem.findByIdAndUpdate = originalFoundMethods.findByIdAndUpdate;
      FoundItem.findByIdAndDelete = originalFoundMethods.findByIdAndDelete;
      FoundItem.countDocuments = originalFoundMethods.countDocuments;
    }
    if (!isDbConnected && originalClaimMethods.create) {
      ClaimRequest.create = originalClaimMethods.create;
      ClaimRequest.countDocuments = originalClaimMethods.countDocuments;
    }
    if (server.closeAllConnections) {
      server.closeAllConnections();
    }
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`\nGate 5B Test Results: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  }
}

runFoundItemTests();
