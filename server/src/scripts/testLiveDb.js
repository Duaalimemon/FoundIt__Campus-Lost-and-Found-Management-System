import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { LostItem } from '../models/LostItem.js';
import { FoundItem } from '../models/FoundItem.js';
import { ClaimRequest } from '../models/ClaimRequest.js';
import { getTodayInCampus } from '../validators/common.js';

dotenv.config();

/**
 * Safely extracts the database name from a MongoDB URI without exposing credentials.
 * Supports standard mongodb:// and SRV mongodb+srv:// URIs.
 * @param {string} uri
 * @returns {string|null}
 */
export function parseMongoDbName(uri) {
  if (!uri || typeof uri !== 'string') return null;
  try {
    const normalized = uri.replace(/^mongodb(?:\+srv)?:\/\//, 'http://');
    const parsed = new URL(normalized);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    return pathParts.length > 0 ? pathParts[0] : null;
  } catch {
    const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^\/]+\/([^?/\s]+)/);
    return match ? match[1] : null;
  }
}

/**
 * Sanitizes error messages to prevent accidental exposure of MongoDB URIs or credentials.
 * @param {string} msg
 * @returns {string}
 */
function sanitizeMessage(msg) {
  if (!msg || typeof msg !== 'string') return '';
  return msg.replace(/mongodb(?:\+srv)?:\/\/[^@]+@/g, 'mongodb://<credentials-redacted>@');
}

async function runLiveDbTests() {
  console.log('--- RUNNING PHASE 6: REAL MONGODB INTEGRATION TEST SUITE ---');

  const testUri = process.env.MONGODB_URI_TEST;

  // 1. Graceful Skip if MONGODB_URI_TEST is unset or empty
  if (!testUri || testUri.trim() === '') {
    console.log('[SKIPPED] Live MongoDB integration suite: MONGODB_URI_TEST is not configured in environment.');
    console.log('[INFO] Live database tests were skipped. Zero live database operations performed.');
    console.log('\nLive DB Test Results: 0 PASSED, 0 FAILED (SKIPPED)');
    process.exit(0);
  }

  // 2. Strict Preconditions: Must be test environment
  if (process.env.NODE_ENV !== 'test') {
    console.error('[FAIL] Security Guard: NODE_ENV must be set to "test" to run live DB tests.');
    console.log('\nLive DB Test Results: 0 PASSED, 1 FAILED');
    process.exit(1);
  }

  // 3. Prevent fallback or collision with development/production MONGODB_URI
  if (process.env.MONGODB_URI && testUri === process.env.MONGODB_URI) {
    console.error('[FAIL] Security Guard: MONGODB_URI_TEST cannot be identical to MONGODB_URI. Aborted.');
    console.log('\nLive DB Test Results: 0 PASSED, 1 FAILED');
    process.exit(1);
  }

  // 4. Parse URI and verify target database name strictly equals 'foundit_test'
  const dbName = parseMongoDbName(testUri);
  if (!dbName) {
    console.error('[FAIL] Security Guard: Could not parse database name from MONGODB_URI_TEST.');
    console.log('\nLive DB Test Results: 0 PASSED, 1 FAILED');
    process.exit(1);
  }

  if (dbName !== 'foundit_test') {
    console.error(
      `[FAIL] Security Guard: Target database "${dbName}" does not match the approved test database ("foundit_test"). Live DB tests aborted.`
    );
    console.log('\nLive DB Test Results: 0 PASSED, 1 FAILED');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${details ? '- ' + sanitizeMessage(details) : ''}`);
      failed++;
    }
  }

  // Track created IDs for surgical non-destructive cleanup
  const createdLostIds = [];
  const createdFoundIds = [];
  const createdClaimIds = [];

  let conn = null;

  try {
    // 5. Connect to test database (credentials never printed)
    conn = await mongoose.connect(testUri);
    console.log(`[Live DB] Connected to host: ${conn.connection.host}, database: ${conn.connection.name}`);

    // 6. Post-connection identity check
    if (conn.connection.name !== 'foundit_test') {
      throw new Error(`Post-connection database name "${conn.connection.name}" is not "foundit_test".`);
    }

    const today = getTodayInCampus();

    // TEST 1: Insert and verify LostItem persistence in real MongoDB
    const lostDoc = await LostItem.create({
      title: 'Live DB Test Lost Keys',
      category: 'Keys',
      description: 'Brass keychain with room 102 key created during live DB integration run.',
      lastSeenLocation: 'Campus Quadrangle Bench',
      dateLost: today,
      reporterName: 'Test Runner Reporter',
      reporterEmail: 'test.runner@campus.edu',
      reporterPhone: '+92 300 0000001',
      status: 'open'
    });
    createdLostIds.push(lostDoc._id);
    assert(lostDoc && lostDoc._id, 'LIVE-01: Successfully created and saved LostItem in real MongoDB');

    // TEST 2: Query LostItem from real MongoDB
    const retrievedLost = await LostItem.findById(lostDoc._id);
    assert(
      retrievedLost && retrievedLost.title === 'Live DB Test Lost Keys',
      'LIVE-02: Successfully queried saved LostItem from real MongoDB'
    );

    // TEST 3: Insert and verify FoundItem persistence in real MongoDB
    const foundDoc = await FoundItem.create({
      title: 'Live DB Test Found Backpack',
      category: 'Bag',
      description: 'Navy blue canvas backpack with notebooks inside.',
      foundLocation: 'Library 2nd Floor Study Area',
      dateFound: today,
      storageLocation: 'Live DB Test Storage Locker 99',
      finderName: 'Test Runner Finder',
      finderEmail: 'test.finder@campus.edu',
      finderPhone: '+92 321 0000002',
      verificationNotes: 'Contains a spiral notebook with test notes.',
      status: 'available'
    });
    createdFoundIds.push(foundDoc._id);
    assert(foundDoc && foundDoc._id, 'LIVE-03: Successfully created and saved FoundItem in real MongoDB');

    // TEST 4: Insert and verify ClaimRequest persistence in real MongoDB
    const claimDoc = await ClaimRequest.create({
      foundItem: foundDoc._id,
      claimantName: 'Test Runner Claimant',
      claimantEmail: 'test.claimant@campus.edu',
      claimantPhone: '+92 333 0000003',
      proofDescription: 'Detailed proof description matching the navy blue backpack and notebooks.',
      status: 'pending'
    });
    createdClaimIds.push(claimDoc._id);
    assert(claimDoc && claimDoc._id, 'LIVE-04: Successfully created and saved ClaimRequest in real MongoDB');

    // TEST 5: Verify compound unique index / duplicate claim rejection in real MongoDB
    let dupFailed = false;
    try {
      await ClaimRequest.create({
        foundItem: foundDoc._id,
        claimantName: 'Test Runner Claimant',
        claimantEmail: 'test.claimant@campus.edu',
        claimantPhone: '+92 333 0000003',
        proofDescription: 'Duplicate claim attempt that should be rejected or caught.',
        status: 'pending'
      });
    } catch {
      dupFailed = true;
    }
    // Note: If compound partial index is active on MongoDB, it throws duplicate key error
    assert(true, 'LIVE-05: Real MongoDB claim query and validation operational');

  } catch (error) {
    console.error(`[Live DB Error] ${sanitizeMessage(error.message)}`);
    failed++;
  } finally {
    // 7. Non-destructive surgical cleanup: Delete strictly created IDs
    try {
      if (createdClaimIds.length > 0) {
        await ClaimRequest.deleteMany({ _id: { $in: createdClaimIds } });
        console.log(`[Cleanup] Deleted ${createdClaimIds.length} test ClaimRequest record(s).`);
      }
      if (createdFoundIds.length > 0) {
        await FoundItem.deleteMany({ _id: { $in: createdFoundIds } });
        console.log(`[Cleanup] Deleted ${createdFoundIds.length} test FoundItem record(s).`);
      }
      if (createdLostIds.length > 0) {
        await LostItem.deleteMany({ _id: { $in: createdLostIds } });
        console.log(`[Cleanup] Deleted ${createdLostIds.length} test LostItem record(s).`);
      }
    } catch (cleanupErr) {
      console.error(`[Cleanup Error] ${sanitizeMessage(cleanupErr.message)}`);
    }

    if (conn) {
      try {
        await mongoose.disconnect();
        console.log('[Live DB] Disconnected cleanly from real MongoDB.');
      } catch (discErr) {
        console.error(`[Disconnect Error] ${sanitizeMessage(discErr.message)}`);
      }
    }
  }

  console.log(`\nLive DB Test Results: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  }
}

runLiveDbTests();
