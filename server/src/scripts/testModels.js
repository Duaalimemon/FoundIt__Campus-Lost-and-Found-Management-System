import mongoose from 'mongoose';
import { LostItem } from '../models/LostItem.js';
import { FoundItem } from '../models/FoundItem.js';
import { ClaimRequest } from '../models/ClaimRequest.js';
import { User } from '../models/User.js';

async function runModelValidationTests() {
  console.log('--- RUNNING MONGOOSE MODEL VALIDATION TESTS (OFFLINE) ---');
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

  // 1. LostItem validation checks
  try {
    const validLost = new LostItem({
      title: 'Student ID Card',
      category: 'ID Card',
      description: 'Lost near the central library entrance yesterday afternoon.',
      lastSeenLocation: 'Central Library',
      dateLost: new Date('2026-10-15'),
      status: 'open',
      reporterName: 'Alice Student',
      reporterEmail: 'alice@campus.edu',
      reporterPhone: '+92 300 1234567'
    });
    const err = validLost.validateSync();
    assert(!err, 'Valid LostItem passes schema validation');
  } catch (e) {
    assert(false, `Valid LostItem threw: ${e.message}`);
  }

  try {
    const invalidLost = new LostItem({
      title: 'AB', // < 3 chars
      category: 'Spaceship', // invalid enum
      description: 'Short', // < 10 chars
      lastSeenLocation: 'L', // < 2 chars
      reporterName: 'A', // < 2 chars
      reporterEmail: 'not-an-email',
      reporterPhone: 'invalid-phone-letters'
    });
    const err = invalidLost.validateSync();
    assert(err && err.errors['title'], 'LostItem rejects title < 3 chars');
    assert(err && err.errors['category'], 'LostItem rejects invalid category enum');
    assert(err && err.errors['description'], 'LostItem rejects description < 10 chars');
    assert(err && err.errors['lastSeenLocation'], 'LostItem rejects lastSeenLocation < 2 chars');
    assert(err && err.errors['reporterName'], 'LostItem rejects reporterName < 2 chars');
    assert(err && err.errors['reporterEmail'], 'LostItem rejects invalid email');
    assert(err && err.errors['reporterPhone'], 'LostItem rejects invalid phone pattern');
  } catch (e) {
    assert(false, `Invalid LostItem check threw: ${e.message}`);
  }

  // 2. FoundItem validation checks
  try {
    const validFound = new FoundItem({
      title: 'Blue Hydro Flask',
      category: 'Other',
      description: 'Metallic blue insulated bottle with campus sticker.',
      foundLocation: 'Cafeteria Table 4',
      dateFound: new Date('2026-10-18'),
      status: 'available',
      storageLocation: 'L&F Cabinet B, Shelf 2',
      finderName: 'Bob Staff',
      finderEmail: 'bob@campus.edu',
      finderPhone: '+92 321 9876543',
      verificationNotes: 'Small scratch on bottom base.'
    });
    const err = validFound.validateSync();
    assert(!err, 'Valid FoundItem passes schema validation');
  } catch (e) {
    assert(false, `Valid FoundItem threw: ${e.message}`);
  }

  try {
    const invalidFound = new FoundItem({
      title: 'Valid Title',
      category: 'Electronics',
      description: 'Valid description text here',
      foundLocation: 'Lab 2',
      dateFound: new Date('2026-10-18'),
      status: 'non-existent-status', // bad enum
      finderName: 'Finder',
      finderEmail: 'finder@campus.edu'
      // missing required storageLocation
    });
    const err = invalidFound.validateSync();
    assert(err && err.errors['storageLocation'], 'FoundItem requires storageLocation');
    assert(err && err.errors['status'], 'FoundItem rejects invalid status enum');
  } catch (e) {
    assert(false, `Invalid FoundItem check threw: ${e.message}`);
  }

  // 3. ClaimRequest validation checks
  const dummyFoundItemId = new mongoose.Types.ObjectId();
  try {
    const validClaim = new ClaimRequest({
      foundItem: dummyFoundItemId,
      claimantName: 'Charlie Claimant',
      claimantEmail: 'charlie@campus.edu',
      proofDescription: 'I have a receipt and the serial number ending in 4429 on my student portal.',
      status: 'pending'
    });
    const err = validClaim.validateSync();
    assert(!err, 'Valid pending ClaimRequest passes schema validation');
  } catch (e) {
    assert(false, `Valid ClaimRequest threw: ${e.message}`);
  }

  try {
    const shortProofClaim = new ClaimRequest({
      foundItem: dummyFoundItemId,
      claimantName: 'Charlie',
      claimantEmail: 'charlie@campus.edu',
      proofDescription: 'Too short', // < 20 chars
      status: 'pending'
    });
    const err = shortProofClaim.validateSync();
    assert(err && err.errors['proofDescription'], 'ClaimRequest rejects proofDescription < 20 chars');
  } catch (e) {
    assert(false, `Short proof check threw: ${e.message}`);
  }

  try {
    const rejectedNoNote = new ClaimRequest({
      foundItem: dummyFoundItemId,
      claimantName: 'Charlie',
      claimantEmail: 'charlie@campus.edu',
      proofDescription: 'Detailed proof description text that exceeds twenty characters.',
      status: 'rejected',
      adminNote: '' // empty note on rejection
    });
    const err = rejectedNoNote.validateSync();
    assert(err && err.errors['adminNote'], 'ClaimRequest requires adminNote (>= 5 chars) when rejected');
  } catch (e) {
    assert(false, `Rejected without note check threw: ${e.message}`);
  }

  try {
    const rejectedWithNote = new ClaimRequest({
      foundItem: dummyFoundItemId,
      claimantName: 'Charlie',
      claimantEmail: 'charlie@campus.edu',
      proofDescription: 'Detailed proof description text that exceeds twenty characters.',
      status: 'rejected',
      adminNote: 'Proof did not match verification notes on file.'
    });
    const err = rejectedWithNote.validateSync();
    assert(!err, 'ClaimRequest passes validation when rejected with valid adminNote');
  } catch (e) {
    assert(false, `Rejected with note check threw: ${e.message}`);
  }

  // 4. User model validation checks (Gate 8C-B)
  try {
    const validStudent = new User({
      name: 'Alice Student',
      email: '  Alice.Student@Campus.Edu  ',
      password: 'StrongPassword123!'
    });
    const err = validStudent.validateSync();
    assert(!err, 'Valid User passes schema validation');
    assert(validStudent.email === 'alice.student@campus.edu', 'User email is trimmed and normalized to lowercase');
    assert(validStudent.role === 'student', 'User role defaults to "student"');
    assert(validStudent.authProvider === 'local', 'User authProvider defaults to "local"');
  } catch (e) {
    assert(false, `Valid User check threw: ${e.message}`);
  }

  try {
    const invalidUser = new User({
      name: 'A', // < 2 chars
      email: 'not-an-email',
      role: 'staff', // unauthorized role enum
      authProvider: 'unknown_provider', // invalid provider enum
      password: 'short' // < 8 chars
    });
    const err = invalidUser.validateSync();
    assert(err && err.errors['name'], 'User rejects name < 2 chars');
    assert(err && err.errors['email'], 'User rejects invalid email format');
    assert(err && err.errors['role'], 'User rejects unauthorized role "staff"');
    assert(err && err.errors['authProvider'], 'User rejects invalid authProvider');
    assert(err && err.errors['password'], 'User rejects password < 8 chars');
  } catch (e) {
    assert(false, `Invalid User check threw: ${e.message}`);
  }

  try {
    const validGoogleUser = new User({
      name: 'Google Student',
      email: 'google.student@campus.edu',
      authProvider: 'google',
      googleId: '109876543210987654321'
    });
    const err = validGoogleUser.validateSync();
    assert(!err, 'Google OAuth student passes validation without password');
    assert(validGoogleUser.authProvider === 'google', 'User authProvider is "google"');
    assert(validGoogleUser.googleId === '109876543210987654321', 'User googleId is stored correctly');
  } catch (e) {
    assert(false, `Google User check threw: ${e.message}`);
  }

  // ---------------------------------------------------------------------------
  // GATE 8C-D: Ownership model references & legacy compatibility
  // ---------------------------------------------------------------------------

  try {
    const dummyUserId = new mongoose.Types.ObjectId();
    const lostWithUser = new LostItem({
      title: 'Valid Lost With User',
      category: 'Electronics',
      description: 'Lost item description here with >= 10 chars',
      lastSeenLocation: 'Library',
      dateLost: new Date(),
      reporterName: 'Student Owner',
      reporterEmail: 'student@campus.edu',
      reportedBy: dummyUserId
    });
    assert(!lostWithUser.validateSync(), 'LostItem accepts valid reportedBy user reference');
    assert(lostWithUser.reportedBy.equals(dummyUserId), 'LostItem reportedBy matches supplied ObjectId');

    const foundWithUser = new FoundItem({
      title: 'Valid Found With User',
      category: 'Electronics',
      description: 'Found item description here with >= 10 chars',
      foundLocation: 'Lab 1',
      dateFound: new Date(),
      storageLocation: 'Locker 1',
      finderName: 'Student Finder',
      finderEmail: 'finder@campus.edu',
      foundBy: dummyUserId
    });
    assert(!foundWithUser.validateSync(), 'FoundItem accepts valid foundBy user reference');
    assert(foundWithUser.foundBy.equals(dummyUserId), 'FoundItem foundBy matches supplied ObjectId');

    const claimWithUser = new ClaimRequest({
      foundItem: new mongoose.Types.ObjectId(),
      claimantName: 'Student Claimant',
      claimantEmail: 'claimant@campus.edu',
      proofDescription: 'Proof description here with >= 20 characters',
      claimedBy: dummyUserId
    });
    assert(!claimWithUser.validateSync(), 'ClaimRequest accepts valid claimedBy user reference');
    assert(claimWithUser.claimedBy.equals(dummyUserId), 'ClaimRequest claimedBy matches supplied ObjectId');
  } catch (e) {
    assert(false, `Ownership references check threw: ${e.message}`);
  }

  console.log(`\nModel Validation Results: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  }
}


runModelValidationTests();
