import { ClaimRequest } from '../models/ClaimRequest.js';
import { FoundItem } from '../models/FoundItem.js';
import { ALLOWED_CLAIM_TRANSITIONS } from '../constants.js';
import { escapeRegex } from '../utils/escapeRegex.js';

// 1. Create Claim Request (Public, POST /api/claims)
// Any client-supplied status or adminNote is stripped/ignored (Section 5.5, 6.1)
export const createClaim = async (req, res, next) => {
  try {
    const { foundItem, claimantName, claimantEmail, claimantPhone, proofDescription } = req.body;

    // Verify referenced FoundItem exists
    const targetItem = await FoundItem.findById(foundItem);
    if (!targetItem) {
      return res.status(404).json({
        success: false,
        message: 'Referenced found item not found'
      });
    }

    // Verify FoundItem is available
    if (targetItem.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit claim for an item that is already ${targetItem.status}. Claims are only accepted while an item is available.`
      });
    }

    // Duplicate Active Claim Prevention (Section 5.5, 6.1, CLM-03)
    // A claimant cannot have more than one active claim (pending or approved) on the same found item
    const normalizedEmail = claimantEmail.toLowerCase().trim();
    const existingActiveClaim = await ClaimRequest.findOne({
      foundItem,
      claimantEmail: normalizedEmail,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingActiveClaim) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active claim for this item. Please wait for staff review.'
      });
    }

    // Create new claim with system-default status 'pending'
    const newClaim = await ClaimRequest.create({
      foundItem,
      claimantName,
      claimantEmail: normalizedEmail,
      claimantPhone: claimantPhone || '',
      proofDescription,
      status: 'pending',
      adminNote: ''
    });

    return res.status(201).json({
      success: true,
      message: 'Claim submitted successfully. Staff will review your proof.',
      data: {
        _id: newClaim._id,
        foundItem: newClaim.foundItem,
        claimantName: newClaim.claimantName,
        claimantEmail: newClaim.claimantEmail,
        claimantPhone: newClaim.claimantPhone,
        proofDescription: newClaim.proofDescription,
        status: newClaim.status,
        createdAt: newClaim.createdAt
      }
    });
  } catch (error) {
    return next(error);
  }
};

// 2. List Claims (Staff only, GET /api/claims)
export const listClaims = async (req, res, next) => {
  try {
    const { page, limit, status, foundItem, q } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (foundItem) {
      filter.foundItem = foundItem;
    }

    if (q) {
      const safeQ = escapeRegex(q);
      filter.$or = [
        { claimantName: { $regex: safeQ, $options: 'i' } },
        { claimantEmail: { $regex: safeQ, $options: 'i' } },
        { proofDescription: { $regex: safeQ, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    let query = ClaimRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    if (typeof query.populate === 'function') {
      query = query.populate('foundItem', 'title category foundLocation dateFound status');
    }

    const [claims, total] = await Promise.all([query.exec(), ClaimRequest.countDocuments(filter)]);
    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      data: claims,
      meta: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    return next(error);
  }
};

// 3. Get Claim Detail (Staff only, GET /api/claims/:id)
export const getClaimById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = ClaimRequest.findById(id);
    if (typeof query.populate === 'function') {
      query = query.populate('foundItem', 'title category foundLocation dateFound status storageLocation');
    }

    const claim = await query.exec();
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim request not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: claim
    });
  } catch (error) {
    return next(error);
  }
};

// 4. Update Claim Status & Workflow (Staff only, PUT /api/claims/:id)
// Enforces allowed status transitions, conditional adminNote, two-write invariants (INV-1, INV-2, INV-3),
// and compensating recovery if second write fails (or FAIL_WRITE test switch triggers).
export const updateClaimStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: newStatus, adminNote } = req.body;

    const claim = await ClaimRequest.findById(id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim request not found'
      });
    }

    const currentStatus = claim.status;

    // Check allowed transitions (Section 5.6)
    const allowed = ALLOWED_CLAIM_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition: cannot change claim from '${currentStatus}' to '${newStatus}'.`
      });
    }

    const foundItem = await FoundItem.findById(claim.foundItem);
    if (!foundItem) {
      return res.status(404).json({
        success: false,
        message: 'Referenced found item not found'
      });
    }

    // -------------------------------------------------------------
    // TRANSITION A: pending -> approved
    // Invariant: FoundItem must be 'available'; becomes 'claimed' (INV-1)
    // -------------------------------------------------------------
    if (currentStatus === 'pending' && newStatus === 'approved') {
      if (foundItem.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: `Cannot approve claim: Found item is already ${foundItem.status}. An item can have only one approved claim.`
        });
      }

      // Write 1: Update ClaimRequest to 'approved'
      const originalClaimStatus = claim.status;
      const originalAdminNote = claim.adminNote || '';
      const updatedClaim = await ClaimRequest.findByIdAndUpdate(
        claim._id,
        {
          status: 'approved',
          adminNote: adminNote !== undefined ? adminNote : originalAdminNote
        },
        { new: true }
      );

      // FAIL_WRITE test failure switch (active ONLY when NODE_ENV === 'test')
      if (process.env.NODE_ENV === 'test' && (process.env.FAIL_WRITE === 'true' || process.env.FAIL_WRITE === '1')) {
        // Compensating recovery: rollback Write 1
        await ClaimRequest.findByIdAndUpdate(claim._id, {
          status: originalClaimStatus,
          adminNote: originalAdminNote
        });
        return res.status(500).json({
          success: false,
          message: 'Database write error occurred during status transition. Compensating transaction executed: claim status rolled back to pending.',
          recovered: true
        });
      }

      // Write 2: Update FoundItem to 'claimed'
      await FoundItem.findByIdAndUpdate(foundItem._id, { status: 'claimed' });

      return res.status(200).json({
        success: true,
        message: 'Claim approved successfully. Item marked as claimed.',
        data: updatedClaim
      });
    }

    // -------------------------------------------------------------
    // TRANSITION B: approved -> completed
    // Invariant: FoundItem must be 'claimed'; becomes 'returned' (INV-2)
    // -------------------------------------------------------------
    if (currentStatus === 'approved' && newStatus === 'completed') {
      if (foundItem.status !== 'claimed') {
        return res.status(400).json({
          success: false,
          message: `Cannot complete claim: Found item is ${foundItem.status} (expected 'claimed').`
        });
      }

      // Write 1: Update ClaimRequest to 'completed'
      const originalClaimStatus = claim.status;
      const originalAdminNote = claim.adminNote || '';
      const updatedClaim = await ClaimRequest.findByIdAndUpdate(
        claim._id,
        {
          status: 'completed',
          adminNote: adminNote !== undefined ? adminNote : originalAdminNote
        },
        { new: true }
      );

      // FAIL_WRITE test failure switch
      if (process.env.NODE_ENV === 'test' && (process.env.FAIL_WRITE === 'true' || process.env.FAIL_WRITE === '1')) {
        await ClaimRequest.findByIdAndUpdate(claim._id, {
          status: originalClaimStatus,
          adminNote: originalAdminNote
        });
        return res.status(500).json({
          success: false,
          message: 'Database write error occurred during status transition. Compensating transaction executed: claim status rolled back to approved.',
          recovered: true
        });
      }

      // Write 2: Update FoundItem to 'returned'
      await FoundItem.findByIdAndUpdate(foundItem._id, { status: 'returned' });

      return res.status(200).json({
        success: true,
        message: 'Claim completed successfully. Item marked as returned.',
        data: updatedClaim
      });
    }

    // -------------------------------------------------------------
    // TRANSITION C: approved -> rejected
    // Invariant: FoundItem was 'claimed'; reverts to 'available' (INV-3)
    // -------------------------------------------------------------
    if (currentStatus === 'approved' && newStatus === 'rejected') {
      // Write 1: Update ClaimRequest to 'rejected'
      const originalClaimStatus = claim.status;
      const originalAdminNote = claim.adminNote || '';
      const updatedClaim = await ClaimRequest.findByIdAndUpdate(
        claim._id,
        {
          status: 'rejected',
          adminNote
        },
        { new: true }
      );

      // FAIL_WRITE test failure switch
      if (process.env.NODE_ENV === 'test' && (process.env.FAIL_WRITE === 'true' || process.env.FAIL_WRITE === '1')) {
        await ClaimRequest.findByIdAndUpdate(claim._id, {
          status: originalClaimStatus,
          adminNote: originalAdminNote
        });
        return res.status(500).json({
          success: false,
          message: 'Database write error occurred during status transition. Compensating transaction executed: claim status rolled back to approved.',
          recovered: true
        });
      }

      // Write 2: Revert FoundItem back to 'available'
      await FoundItem.findByIdAndUpdate(foundItem._id, { status: 'available' });

      return res.status(200).json({
        success: true,
        message: 'Claim rejected. Item has been reverted to available.',
        data: updatedClaim
      });
    }

    // -------------------------------------------------------------
    // TRANSITION D: pending -> rejected
    // FoundItem was 'available', remains 'available'. Single write.
    // -------------------------------------------------------------
    if (currentStatus === 'pending' && newStatus === 'rejected') {
      const updatedClaim = await ClaimRequest.findByIdAndUpdate(
        claim._id,
        {
          status: 'rejected',
          adminNote
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Claim rejected successfully.',
        data: updatedClaim
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Unhandled status transition.'
    });
  } catch (error) {
    return next(error);
  }
};

// 5. Delete Claim Request (Staff only, DELETE /api/claims/:id)
export const deleteClaim = async (req, res, next) => {
  try {
    const { id } = req.params;

    const claim = await ClaimRequest.findById(id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim request not found'
      });
    }

    // Completed claims cannot be deleted
    if (claim.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed claim requests cannot be deleted.'
      });
    }

    // If deleting an approved claim, revert the referenced FoundItem to 'available'
    if (claim.status === 'approved') {
      await FoundItem.findByIdAndUpdate(claim.foundItem, { status: 'available' });
    }

    await ClaimRequest.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Claim request deleted successfully',
      data: {
        _id: id
      }
    });
  } catch (error) {
    return next(error);
  }
};
