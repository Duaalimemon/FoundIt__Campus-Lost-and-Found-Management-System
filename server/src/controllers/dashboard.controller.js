import { LostItem } from '../models/LostItem.js';
import { FoundItem } from '../models/FoundItem.js';
import { ClaimRequest } from '../models/ClaimRequest.js';

// Get Dashboard Summary & Stats (Section 6.1)
export const getDashboardSummary = async (req, res, next) => {
  try {
    const [
      totalLost,
      openLost,
      resolvedLost,
      totalFound,
      availableFound,
      claimedFound,
      returnedFound,
      totalClaims,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      completedClaims
    ] = await Promise.all([
      LostItem.countDocuments({}),
      LostItem.countDocuments({ status: 'open' }),
      LostItem.countDocuments({ status: 'resolved' }),
      FoundItem.countDocuments({}),
      FoundItem.countDocuments({ status: 'available' }),
      FoundItem.countDocuments({ status: 'claimed' }),
      FoundItem.countDocuments({ status: 'returned' }),
      ClaimRequest.countDocuments({}),
      ClaimRequest.countDocuments({ status: 'pending' }),
      ClaimRequest.countDocuments({ status: 'approved' }),
      ClaimRequest.countDocuments({ status: 'rejected' }),
      ClaimRequest.countDocuments({ status: 'completed' })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        lost: {
          total: totalLost,
          open: openLost,
          resolved: resolvedLost
        },
        found: {
          total: totalFound,
          available: availableFound,
          claimed: claimedFound,
          returned: returnedFound
        },
        claims: {
          total: totalClaims,
          pending: pendingClaims,
          approved: approvedClaims,
          rejected: rejectedClaims,
          completed: completedClaims
        },
        summary: {
          totalLost,
          openLost,
          resolvedLost,
          totalFound,
          availableFound,
          claimedFound,
          returnedFound,
          totalClaims,
          pendingClaims,
          approvedClaims,
          rejectedClaims,
          completedClaims
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};
