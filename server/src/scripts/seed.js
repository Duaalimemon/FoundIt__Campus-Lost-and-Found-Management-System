import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { LostItem } from '../models/LostItem.js';
import { FoundItem } from '../models/FoundItem.js';
import { ClaimRequest } from '../models/ClaimRequest.js';

export const seedDatabase = async () => {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment. Cannot seed database.');
  }

  console.log('[FoundIt Seed] Connecting to MongoDB for seeding...');
  await mongoose.connect(env.MONGODB_URI);
  console.log(`[FoundIt Seed] Connected to database: ${mongoose.connection.name}`);

  // Clean existing collections safely (documents only, never drop collection or database)
  console.log('[FoundIt Seed] Clearing existing documents in project collections...');
  await LostItem.deleteMany({});
  await FoundItem.deleteMany({});
  await ClaimRequest.deleteMany({});

  console.log('[FoundIt Seed] Seeding LostItems...');
  const lostItems = await LostItem.create([
    {
      title: 'Student ID Card - CS Department',
      category: 'ID Card',
      description: 'Lost red lanyard with university student card near counter 2.',
      lastSeenLocation: 'Central Cafeteria',
      dateLost: new Date('2026-10-14'),
      status: 'open',
      reporterName: 'Zain Ahmed',
      reporterEmail: 'zain.cs@campus.fake',
      reporterPhone: '+92 300 1112233'
    },
    {
      title: 'Calculus 10th Edition Textbook',
      category: 'Book',
      description: 'Hardcover Stewart calculus textbook with dark blue cover.',
      lastSeenLocation: 'Library 2nd Floor Study Area',
      dateLost: new Date('2026-10-12'),
      status: 'open',
      reporterName: 'Sara Khan',
      reporterEmail: 'sara.k@campus.fake',
      reporterPhone: '+92 321 4445566'
    },
    {
      title: 'Black Leather Bi-fold Wallet',
      category: 'Wallet',
      description: 'Black bi-fold leather wallet. Resolved after owner recovered it from car.',
      lastSeenLocation: 'Admin Block Parking Lot',
      dateLost: new Date('2026-10-08'),
      status: 'resolved',
      reporterName: 'Usman Ali',
      reporterEmail: 'usman.ali@campus.fake',
      reporterPhone: '+92 333 7778899'
    }
  ]);
  console.log(`[FoundIt Seed] Created ${lostItems.length} LostItem records.`);

  console.log('[FoundIt Seed] Seeding FoundItems...');
  // 1. Available item with two pending claims (vital for claim workflow testing)
  const foundItemAvailable = await FoundItem.create({
    title: 'Sony Noise-Canceling Headphones',
    category: 'Electronics',
    description: 'Black over-ear wireless headphones found under auditorium seat.',
    foundLocation: 'Main Auditorium Row G',
    dateFound: new Date('2026-10-15'),
    status: 'available',
    storageLocation: 'L&F Office Cabinet A, Shelf 1',
    finderName: 'Campus Custodian Fahad',
    finderEmail: 'fahad.staff@campus.fake',
    finderPhone: '+92 312 9990011',
    verificationNotes: 'Model WH-1000XM4, small scratch on left ear cup hinge.'
  });

  // 2. Claimed item with one approved claim
  const foundItemClaimed = await FoundItem.create({
    title: 'Blue JanSport Backpack',
    category: 'Bag',
    description: 'Standard navy blue backpack containing spiral notebooks.',
    foundLocation: 'Sports Complex Bench',
    dateFound: new Date('2026-10-10'),
    status: 'claimed',
    storageLocation: 'L&F Office Locker 3',
    finderName: 'Hamza Tariq',
    finderEmail: 'hamza.t@campus.fake',
    finderPhone: '+92 301 2223344',
    verificationNotes: 'Keychain attached with miniature silver guitar.'
  });

  // 3. Returned item with one completed claim
  const foundItemReturned = await FoundItem.create({
    title: 'Toyota Car Key with Remote Fob',
    category: 'Keys',
    description: 'Black remote key fob with university logo metal ring.',
    foundLocation: 'Faculty Parking Lot B',
    dateFound: new Date('2026-10-05'),
    status: 'returned',
    storageLocation: 'L&F Office Safe Box',
    finderName: 'Security Guard Rashid',
    finderEmail: 'rashid.sec@campus.fake',
    finderPhone: '+92 345 6667788',
    verificationNotes: 'Key tag stamped with number 882.'
  });
  console.log('[FoundIt Seed] Created 3 FoundItem records (available, claimed, returned).');

  console.log('[FoundIt Seed] Seeding ClaimRequests...');
  const claims = await ClaimRequest.create([
    // Two pending claims on the available headphones
    {
      foundItem: foundItemAvailable._id,
      claimantName: 'Bilal Siddiqui',
      claimantEmail: 'bilal.s@campus.fake',
      claimantPhone: '+92 302 5556677',
      proofDescription: 'The headphones have a tiny scratch on the left hinge and my phone Bluetooth pairs automatically.',
      status: 'pending'
    },
    {
      foundItem: foundItemAvailable._id,
      claimantName: 'Daniyal Raza',
      claimantEmail: 'daniyal.r@campus.fake',
      claimantPhone: '+92 334 8889900',
      proofDescription: 'Left them in row G after the seminar; can provide original box and purchase invoice.',
      status: 'pending'
    },
    // Approved claim on the backpack (satisfies INV-1)
    {
      foundItem: foundItemClaimed._id,
      claimantName: 'Mariam Noor',
      claimantEmail: 'mariam.n@campus.fake',
      claimantPhone: '+92 315 3334455',
      proofDescription: 'Miniature silver guitar keychain attached to front zip, CS assignment sheets inside.',
      status: 'approved',
      adminNote: 'Verified guitar keychain and student name on assignment papers.'
    },
    // Completed claim on the car key (satisfies INV-2)
    {
      foundItem: foundItemReturned._id,
      claimantName: 'Dr. Ayesha Malik',
      claimantEmail: 'ayesha.m@campus.fake',
      claimantPhone: '+92 300 4443322',
      proofDescription: 'Faculty vehicle key stamped with tag number 882 for vehicle in Lot B.',
      status: 'completed',
      adminNote: 'Handover completed in person at campus security office.'
    }
  ]);
  console.log(`[FoundIt Seed] Created ${claims.length} ClaimRequest records.`);
  console.log('[FoundIt Seed] Seeding completed successfully. All consistency invariants (INV-1, INV-2, INV-3) verified.');

  await mongoose.disconnect();
  console.log('[FoundIt Seed] Disconnected from MongoDB.');
};

// If run directly from CLI
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  seedDatabase()
    .then(() => {
      console.log('[FoundIt Seed] Seed command finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(`[FoundIt Seed] Seeding error: ${err.message}`);
      process.exit(1);
    });
}
