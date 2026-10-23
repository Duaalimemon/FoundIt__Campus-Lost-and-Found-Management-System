import { LostItem } from '../models/LostItem.js';
import { PUBLIC_FIELDS } from '../constants.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { parseToMidnightUTC } from '../validators/common.js';

// 1. Create LostItem Report (Public, POST /api/lost-items)
// Privacy Rule (Section 6.5, LST-09): Never returns saved doc. Reloads with .select(PUBLIC_FIELDS).
export const createLostItem = async (req, res, next) => {
  try {
    const { title, category, description, lastSeenLocation, dateLost, reporterName, reporterEmail, reporterPhone } = req.body;

    // Create report with default status 'open' (client-supplied status ignored per LST-02)
    const newReport = await LostItem.create({
      title,
      category,
      description,
      lastSeenLocation,
      dateLost,
      status: 'open',
      reporterName,
      reporterEmail,
      reporterPhone: reporterPhone || ''
    });

    // Reload document with ONLY public fields for the response
    const publicData = await LostItem.findById(newReport._id).select(PUBLIC_FIELDS.lostItem);

    return res.status(201).json({
      success: true,
      message: 'Report submitted. Staff can contact you using the details you gave.',
      data: publicData
    });
  } catch (error) {
    return next(error);
  }
};

// 2. List LostItems (Public+, GET /api/lost-items)
// Anonymous callers receive only PUBLIC_FIELDS; staff callers receive all fields (Section 3.3, LST-03, LST-04)
export const listLostItems = async (req, res, next) => {
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
        { lastSeenLocation: { $regex: safeQ, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      filter.dateLost = {};
      if (dateFrom) {
        filter.dateLost.$gte = parseToMidnightUTC(dateFrom);
      }
      if (dateTo) {
        // End of specified day inclusive
        const toDate = parseToMidnightUTC(dateTo);
        toDate.setUTCHours(23, 59, 59, 999);
        filter.dateLost.$lte = toDate;
      }
    }

    const isStaff = req.user && req.user.role === 'staff';
    const skip = (page - 1) * limit;

    let query = LostItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    if (!isStaff) {
      query = query.select(PUBLIC_FIELDS.lostItem);
    }

    const [items, total] = await Promise.all([query.exec(), LostItem.countDocuments(filter)]);
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

// 3. Get LostItem Detail (Public+, GET /api/lost-items/:id)
export const getLostItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isStaff = req.user && req.user.role === 'staff';

    let query = LostItem.findById(id);
    if (!isStaff) {
      query = query.select(PUBLIC_FIELDS.lostItem);
    }

    const item = await query.exec();
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lost item report not found'
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

// 4. Update LostItem Report (Staff only, PUT /api/lost-items/:id)
// Allows switching status between 'open' and 'resolved' freely (Section 5.2, 5.6, LST-05)
export const updateLostItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedItem = await LostItem.findByIdAndUpdate(
      id,
      {
        ...updateData,
        reporterPhone: updateData.reporterPhone || ''
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Lost item report not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: updatedItem
    });
  } catch (error) {
    return next(error);
  }
};

// 5. Delete LostItem Report (Staff only, DELETE /api/lost-items/:id)
// Always allowed for staff after confirmation (Section 5.7, LST-06)
export const deleteLostItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedItem = await LostItem.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Lost item report not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
      data: {
        _id: id
      }
    });
  } catch (error) {
    return next(error);
  }
};
