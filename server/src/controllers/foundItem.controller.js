import { FoundItem } from '../models/FoundItem.js';
import { ClaimRequest } from '../models/ClaimRequest.js';
import { PUBLIC_FIELDS } from '../constants.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { parseToMidnightUTC } from '../validators/common.js';

// 1. Create FoundItem Report (Student only, POST /api/found-items, Gate 8C-D)
// Privacy Rule (Section 6.5, FND-08): Never returns saved doc. Reloads with .select(PUBLIC_FIELDS.foundItem).
// Client-supplied status is ignored and forced to 'available'.
export const createFoundItem = async (req, res, next) => {
  try {
    const {
      title,
      category,
      description,
      foundLocation,
      dateFound,
      storageLocation,
      finderName,
      finderEmail,
      finderPhone,
      verificationNotes
    } = req.body;

    const newReport = await FoundItem.create({
      title,
      category,
      description,
      foundLocation,
      dateFound,
      status: 'available',
      storageLocation,
      finderName,
      finderEmail,
      finderPhone: finderPhone || '',
      verificationNotes: verificationNotes || '',
      foundBy: req.user.id
    });

    // Reload document with ONLY public fields for the response
    const publicData = await FoundItem.findById(newReport._id).select(PUBLIC_FIELDS.foundItem);

    return res.status(201).json({
      success: true,
      message: 'Found item report submitted successfully. Thank you for reporting!',
      data: publicData
    });
  } catch (error) {
    return next(error);
  }
};


// 2. List FoundItems (Public+, GET /api/found-items)
// Anonymous callers receive only PUBLIC_FIELDS; staff callers receive all fields (Section 3.3, FND-03, FND-04)
export const listFoundItems = async (req, res, next) => {
  try {
    const { page, limit, q, category, status, dateFrom, dateTo } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (q) {
      const safeQ = escapeRegex(q);
      filter.$or = [
        { title: { $regex: safeQ, $options: 'i' } },
        { description: { $regex: safeQ, $options: 'i' } },
        { foundLocation: { $regex: safeQ, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      filter.dateFound = {};
      if (dateFrom) {
        filter.dateFound.$gte = parseToMidnightUTC(dateFrom);
      }
      if (dateTo) {
        // End of specified day inclusive
        const toDate = parseToMidnightUTC(dateTo);
        toDate.setUTCHours(23, 59, 59, 999);
        filter.dateFound.$lte = toDate;
      }
    }

    const isStaff = req.user && req.user.role === 'staff';
    const skip = (page - 1) * limit;

    let query = FoundItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    if (!isStaff) {
      query = query.select(PUBLIC_FIELDS.foundItem);
    }

    const [items, total] = await Promise.all([query.exec(), FoundItem.countDocuments(filter)]);
    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      data: items,
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

// 3. Get FoundItem Detail (Public+, GET /api/found-items/:id)
export const getFoundItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isStaff = req.user && req.user.role === 'staff';

    let query = FoundItem.findById(id);
    if (!isStaff) {
      query = query.select(PUBLIC_FIELDS.foundItem);
    }

    const item = await query.exec();
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    return next(error);
  }
};

// 4. Update FoundItem Report (Staff only, PUT /api/found-items/:id)
// Editing allowed ONLY while status is 'available'; status cannot be modified via PUT
export const updateFoundItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingItem = await FoundItem.findById(id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found'
      });
    }

    // Protection 1: Allow editing only while status is 'available'
    if (existingItem.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit found item: item is already ${existingItem.status}. Editing is only permitted while status is available.`
      });
    }

    // Protection 2: Status cannot be changed via PUT
    if (req.body.status && req.body.status !== existingItem.status) {
      return res.status(400).json({
        success: false,
        message: 'Found item status cannot be modified via PUT. Status transitions are managed via the claim workflow.'
      });
    }

    const { status, ...updateData } = req.body;

    const updatedItem = await FoundItem.findByIdAndUpdate(
      id,
      {
        ...updateData,
        finderPhone: updateData.finderPhone || '',
        verificationNotes: updateData.verificationNotes || ''
      },
      {
        new: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Found item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    return next(error);
  }
};

// 5. Delete FoundItem Report (Staff only, DELETE /api/found-items/:id)
// Protection 3: Prevent deletion when claims reference the item, returning HTTP 409 with the claim count.
export const deleteFoundItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingItem = await FoundItem.findById(id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found'
      });
    }

    // Check for claims referencing this item
    const claimCount = await ClaimRequest.countDocuments({ foundItem: id });
    if (claimCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete found item: ${claimCount} claim(s) reference this item. Items with claim history cannot be deleted.`,
        claimCount,
        count: claimCount
      });
    }

    await FoundItem.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Found item deleted successfully',
      data: {
        _id: id
      }
    });
  } catch (error) {
    return next(error);
  }
};

// 6. List Student's Own FoundItems (Student only, GET /api/found-items/mine, Gate 8C-D)
export const listMyFoundItems = async (req, res, next) => {
  try {
    const items = await FoundItem.find({ foundBy: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    return next(error);
  }
};

