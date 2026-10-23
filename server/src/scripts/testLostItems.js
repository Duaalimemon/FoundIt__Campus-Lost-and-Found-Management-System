import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../app.js';
import { env } from '../config/env.js';
import { LostItem } from '../models/LostItem.js';
import { PUBLIC_FIELDS } from '../constants.js';
import { getTodayInCampus } from '../validators/common.js';

async function runLostItemTests() {
  console.log('--- RUNNING GATE 5A: LOSTITEM CRUD TESTS (LST-01 to LST-09, SEC-05 to SEC-07) ---');
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

  // Ephemeral test HTTP server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/lost-items`;

  // In-memory test store to simulate database operations if offline
  const memoryStore = new Map();

  // Setup in-memory mock query wrapper if MongoDB is not connected
  const isDbConnected = mongoose.connection.readyState === 1;
  let originalMethods = {};

  if (!isDbConnected) {
    console.log('[Test Setup] Operating with isolated in-memory model driver.');

    originalMethods = {
      create: LostItem.create,
      find: LostItem.find,
      findById: LostItem.findById,
      findByIdAndUpdate: LostItem.findByIdAndUpdate,
      findByIdAndDelete: LostItem.findByIdAndDelete,
      countDocuments: LostItem.countDocuments
    };

    LostItem.create = async (doc) => {
      const id = new mongoose.Types.ObjectId().toString();
      const saved = {
        _id: id,
        ...doc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0
      };
      memoryStore.set(id, saved);
      return saved;
    };

    LostItem.find = (filter = {}) => {
      let results = Array.from(memoryStore.values());

      // Filter category
      if (filter.category) {
        results = results.filter((r) => r.category === filter.category);
      }
      // Filter status
      if (filter.status) {
        results = results.filter((r) => r.status === filter.status);
      }
      // Filter q ($or)
      if (filter.$or) {
        const regexes = filter.$or.map((cond) => {
          const key = Object.keys(cond)[0];
          return { key, re: new RegExp(cond[key].$regex, cond[key].$options) };
        });
        results = results.filter((r) => regexes.some(({ key, re }) => re.test(r[key] || '')));
      }
      // Filter dateLost
      if (filter.dateLost) {
        if (filter.dateLost.$gte) {
          results = results.filter((r) => new Date(r.dateLost) >= filter.dateLost.$gte);
        }
        if (filter.dateLost.$lte) {
          results = results.filter((r) => new Date(r.dateLost) <= filter.dateLost.$lte);
        }
      }

      // Sort newest first
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

    LostItem.findById = (id) => {
      const item = memoryStore.get(String(id));
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

    LostItem.findByIdAndUpdate = async (id, updateData) => {
      const item = memoryStore.get(String(id));
      if (!item) return null;
      const updated = {
        ...item,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      memoryStore.set(String(id), updated);
      return updated;
    };

    LostItem.findByIdAndDelete = async (id) => {
      const item = memoryStore.get(String(id));
      if (!item) return null;
      memoryStore.delete(String(id));
      return item;
    };

    LostItem.countDocuments = async (filter = {}) => {
      return (await LostItem.find(filter).exec()).length;
    };
  }

  try {
    const today = getTodayInCampus();

    // -------------------------------------------------------------
    // LST-01: Create valid lost report
    // -------------------------------------------------------------
    const validReportData = {
      title: 'Lost Student ID Card',
      category: 'ID Card',
      description: 'Lost red lanyard with card near the main cafeteria counter.',
      lastSeenLocation: 'Main Cafeteria',
      dateLost: today,
      reporterName: 'Alice Student',
      reporterEmail: 'alice@campus.fake',
      reporterPhone: '+92 300 1234567'
    };

    const resLST01 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validReportData)
    });
    const bodyLST01 = await resLST01.json();
    assert(resLST01.status === 201, 'LST-01: Create returns 201 Created');
    assert(bodyLST01.success === true, 'LST-01: Response has success: true');
    assert(bodyLST01.data?.title === 'Lost Student ID Card', 'LST-01: Response data holds created title');
    assert(bodyLST01.data?.status === 'open', 'LST-01: New report has default status "open"');
    const createdId = bodyLST01.data?._id;
    assert(Boolean(createdId), 'LST-01: Response includes generated _id');

    // -------------------------------------------------------------
    // LST-02: Missing fields, short title, bad email; supplied status ignored
    // -------------------------------------------------------------
    const resLST02 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'AB', // < 3 chars
        category: 'ID Card',
        description: 'Short', // < 10 chars
        lastSeenLocation: 'A', // < 2 chars
        dateLost: today,
        reporterName: 'A', // < 2 chars
        reporterEmail: 'not-an-email',
        status: 'resolved' // Client tries to supply status
      })
    });
    const bodyLST02 = await resLST02.json();
    assert(resLST02.status === 400, 'LST-02: Invalid body returns 400 Validation failed');
    assert(bodyLST02.errors && bodyLST02.errors.length >= 4, 'LST-02: Returns per-field validation error list');

    // Verify supplied status is ignored when body is valid
    const resLST02Status = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validReportData,
        title: 'Report with Attempted Status Injection',
        status: 'resolved'
      })
    });
    const bodyLST02Status = await resLST02Status.json();
    assert(bodyLST02Status.data?.status === 'open', 'LST-02: Supplied status is ignored on create; record is open');

    // -------------------------------------------------------------
    // LST-03: List with search, category, status filters & pagination
    // -------------------------------------------------------------
    // Create a book report to test filtering
    await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validReportData,
        title: 'Calculus Stewart Textbook',
        category: 'Book'
      })
    });

    const resListAll = await fetch(`${baseUrl}?page=1&limit=10`);
    const bodyListAll = await resListAll.json();
    assert(resListAll.status === 200, 'LST-03: GET /api/lost-items returns 200 OK');
    assert(bodyListAll.meta?.page === 1, 'LST-03: Meta reflects page 1');
    assert(bodyListAll.meta?.total >= 2, 'LST-03: Meta reflects total items');

    // Filter by category=Book
    const resListCat = await fetch(`${baseUrl}?category=Book`);
    const bodyListCat = await resListCat.json();
    assert(bodyListCat.data?.every((i) => i.category === 'Book'), 'LST-03: Category filter restricts results');

    // Filter by text search q=Calculus
    const resListQ = await fetch(`${baseUrl}?q=Calculus`);
    const bodyListQ = await resListQ.json();
    assert(bodyListQ.data?.length >= 1 && bodyListQ.data[0].title.includes('Calculus'), 'LST-03: Text query q searches title/description');

    // -------------------------------------------------------------
    // LST-04: Public detail versus staff detail projection
    // -------------------------------------------------------------
    const resPublicDetail = await fetch(`${baseUrl}/${createdId}`);
    const bodyPublicDetail = await resPublicDetail.json();
    assert(resPublicDetail.status === 200, 'LST-04: Public detail returns 200');
    assert(bodyPublicDetail.data?.reporterName === undefined, 'LST-04: Public detail excludes reporterName');
    assert(bodyPublicDetail.data?.reporterEmail === undefined, 'LST-04: Public detail excludes reporterEmail');
    assert(bodyPublicDetail.data?.reporterPhone === undefined, 'LST-04: Public detail excludes reporterPhone');

    const resStaffDetail = await fetch(`${baseUrl}/${createdId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyStaffDetail = await resStaffDetail.json();
    assert(resStaffDetail.status === 200, 'LST-04: Staff detail returns 200');
    assert(bodyStaffDetail.data?.reporterName === 'Alice Student', 'LST-04: Staff detail includes reporterName');
    assert(bodyStaffDetail.data?.reporterEmail === 'alice@campus.fake', 'LST-04: Staff detail includes reporterEmail');

    // -------------------------------------------------------------
    // LST-05: Staff update (open -> resolved -> open); invalid status 400
    // -------------------------------------------------------------
    const resUpdateResolved = await fetch(`${baseUrl}/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        ...validReportData,
        status: 'resolved'
      })
    });
    const bodyUpdateResolved = await resUpdateResolved.json();
    assert(resUpdateResolved.status === 200, 'LST-05: Staff can switch status to "resolved"');
    assert(bodyUpdateResolved.data?.status === 'resolved', 'LST-05: Status updated to "resolved"');

    // Switch back to open
    const resUpdateOpen = await fetch(`${baseUrl}/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        ...validReportData,
        status: 'open'
      })
    });
    const bodyUpdateOpen = await resUpdateOpen.json();
    assert(bodyUpdateOpen.data?.status === 'open', 'LST-05: Staff can switch status back to "open"');

    // Invalid status update
    const resUpdateBadStatus = await fetch(`${baseUrl}/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        ...validReportData,
        status: 'invalid_status_value'
      })
    });
    assert(resUpdateBadStatus.status === 400, 'LST-05: Update with invalid status returns 400');

    // -------------------------------------------------------------
    // LST-06: Staff delete report
    // -------------------------------------------------------------
    const resDelete = await fetch(`${baseUrl}/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const bodyDelete = await resDelete.json();
    assert(resDelete.status === 200, 'LST-06: Staff delete returns 200 OK');
    assert(bodyDelete.data?._id === createdId, 'LST-06: Returns deleted record _id');

    // Check item is now 404
    const resAfterDelete = await fetch(`${baseUrl}/${createdId}`);
    assert(resAfterDelete.status === 404, 'LST-06: Deleted record returns 404 on subsequent get');

    // -------------------------------------------------------------
    // LST-07: Malformed ID (400) vs Unknown ID (404)
    // -------------------------------------------------------------
    const resBadId = await fetch(`${baseUrl}/abc`);
    assert(resBadId.status === 400, 'LST-07: Malformed ID parameter returns 400 Invalid ID format');

    const unknownId = new mongoose.Types.ObjectId().toString();
    const resUnknownId = await fetch(`${baseUrl}/${unknownId}`);
    assert(resUnknownId.status === 404, 'LST-07: Well-formed non-existent ID returns 404');

    // -------------------------------------------------------------
    // LST-08: Date rule DR-1 checks
    // -------------------------------------------------------------
    // 1. Tomorrow in campus timezone
    const now = new Date();
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);
    const resTomorrow = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validReportData,
        dateLost: tomorrowStr
      })
    });
    assert(resTomorrow.status === 400, 'LST-08: DR-1 rejects future date with 400');

    // 2. Today in campus timezone
    const resToday = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validReportData,
        title: 'Today Lost Report',
        dateLost: today
      })
    });
    assert(resToday.status === 201, 'LST-08: DR-1 accepts today date with 201');

    // 3. A date years ago (no lower limit)
    const resOldDate = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validReportData,
        title: 'Old Lost Report',
        dateLost: '2021-03-15'
      })
    });
    assert(resOldDate.status === 201, 'LST-08: DR-1 accepts historical date from years ago with 201');

    // 4. Impossible calendar date 2026-02-31
    const resImpossible = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validReportData,
        dateLost: '2026-02-31'
      })
    });
    assert(resImpossible.status === 400, 'LST-08: DR-1 rejects impossible date (2026-02-31) with 400');

    // -------------------------------------------------------------
    // LST-09: Privacy rule verification for POST /api/lost-items
    // -------------------------------------------------------------
    // Create anonymously with contact info
    const resPrivAnon = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validReportData,
        title: 'Privacy Verification Test Item',
        reporterName: 'Confidential Name',
        reporterEmail: 'confidential@campus.fake',
        reporterPhone: '+92 300 9998877'
      })
    });
    const rawAnonText = await resPrivAnon.text();
    const rawAnonJson = JSON.parse(rawAnonText);
    assert(resPrivAnon.status === 201, 'LST-09: Anonymous create returns 201');
    assert(!rawAnonText.includes('Confidential Name'), 'LST-09: Raw JSON does not leak reporterName');
    assert(!rawAnonText.includes('confidential@campus.fake'), 'LST-09: Raw JSON does not leak reporterEmail');
    assert(!rawAnonText.includes('+92 300 9998877'), 'LST-09: Raw JSON does not leak reporterPhone');
    assert(rawAnonJson.data?.__v === undefined, 'LST-09: Raw JSON excludes __v');
    assert(rawAnonJson.data?.updatedAt === undefined, 'LST-09: Raw JSON excludes updatedAt');
    assert(rawAnonJson.message === 'Report submitted. Staff can contact you using the details you gave.', 'LST-09: Includes exact confirmation message');

    // Repeat with valid staff token: response must be IDENTICAL
    const resPrivStaff = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        ...validReportData,
        title: 'Staff Created Item',
        reporterName: 'Staff Caller Name',
        reporterEmail: 'staffcaller@campus.fake',
        reporterPhone: '+92 311 0001122'
      })
    });
    const rawStaffText = await resPrivStaff.text();
    const rawStaffJson = JSON.parse(rawStaffText);
    assert(resPrivStaff.status === 201, 'LST-09: Staff create returns 201');
    assert(!rawStaffText.includes('Staff Caller Name'), 'LST-09: Staff create response strictly hides reporterName');
    assert(!rawStaffText.includes('staffcaller@campus.fake'), 'LST-09: Staff create response strictly hides reporterEmail');

    // Validation error must not echo back submitted contact values
    const resPrivValError = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'AB',
        reporterEmail: 'secret_user@campus.fake'
      })
    });
    const rawValErrorText = await resPrivValError.text();
    assert(resPrivValError.status === 400, 'LST-09: Validation error returns 400');
    assert(!rawValErrorText.includes('secret_user@campus.fake'), 'LST-09: Validation error does not echo submitted contact values');

    // -------------------------------------------------------------
    // SEC-05 (part): Inspect public JSON for LostItem
    // -------------------------------------------------------------
    const resSec05 = await fetch(`${baseUrl}?limit=5`);
    const rawSec05Text = await resSec05.text();
    assert(!rawSec05Text.includes('reporterEmail'), 'SEC-05: Public list JSON has zero reporterEmail keys');
    assert(!rawSec05Text.includes('reporterPhone'), 'SEC-05: Public list JSON has zero reporterPhone keys');

    // -------------------------------------------------------------
    // SEC-06 (part): Anonymous search for private value returns no match
    // -------------------------------------------------------------
    const resSec06 = await fetch(`${baseUrl}?q=alice@campus.fake`);
    const bodySec06 = await resSec06.json();
    assert(bodySec06.data?.length === 0, 'SEC-06: Anonymous search for private email returns 0 results');

    // -------------------------------------------------------------
    // SEC-07 (part): NoSQL injection, oversized payload, malformed JSON
    // -------------------------------------------------------------
    // NoSQL object payload
    const resNoSql = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: { $gt: '' },
        category: 'ID Card'
      })
    });
    assert(resNoSql.status === 400, 'SEC-07: { "$gt": "" } payload rejected with 400');

    // Malformed JSON string
    const resMalformedJson = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"title": "Unclosed string'
    });
    assert(resMalformedJson.status === 400, 'SEC-07: Malformed JSON payload returns 400');

  } finally {
    // Restore Mongoose original methods if mocked
    if (!isDbConnected && originalMethods.create) {
      LostItem.create = originalMethods.create;
      LostItem.find = originalMethods.find;
      LostItem.findById = originalMethods.findById;
      LostItem.findByIdAndUpdate = originalMethods.findByIdAndUpdate;
      LostItem.findByIdAndDelete = originalMethods.findByIdAndDelete;
      LostItem.countDocuments = originalMethods.countDocuments;
    }
    if (server.closeAllConnections) {
      server.closeAllConnections();
    }
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`\nGate 5A Test Results: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  }
}

runLostItemTests();
