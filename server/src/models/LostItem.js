import mongoose from 'mongoose';
import { CATEGORIES, LOST_STATUSES, PHONE_REGEX } from '../constants.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const lostItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category'
      }
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    lastSeenLocation: {
      type: String,
      required: [true, 'Last seen location is required'],
      trim: true,
      minlength: [2, 'Last seen location must be at least 2 characters'],
      maxlength: [100, 'Last seen location cannot exceed 100 characters']
    },
    dateLost: {
      type: Date,
      required: [true, 'Date lost is required']
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: LOST_STATUSES,
        message: '{VALUE} is not a valid lost status'
      },
      default: 'open'
    },
    reporterName: {
      type: String,
      required: [true, 'Reporter name is required'],
      trim: true,
      minlength: [2, 'Reporter name must be at least 2 characters'],
      maxlength: [80, 'Reporter name cannot exceed 80 characters']
    },
    reporterEmail: {
      type: String,
      required: [true, 'Reporter email is required'],
      trim: true,
      lowercase: true,
      maxlength: [100, 'Reporter email cannot exceed 100 characters'],
      validate: {
        validator: (v) => emailRegex.test(v),
        message: 'Reporter email is invalid'
      }
    },
    reporterPhone: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (v) {
          // Optional field: valid if empty or matches pattern
          return !v || PHONE_REGEX.test(v);
        },
        message: 'Reporter phone number format is invalid'
      }
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: undefined
    }
  },
  {
    timestamps: true,
    collection: 'lostitems'
  }
);

// Indexes per Section 5.9: default ordering and list filters
lostItemSchema.index({ createdAt: -1, category: 1, status: 1 });
lostItemSchema.index({ reportedBy: 1 });

export const LostItem = mongoose.model('LostItem', lostItemSchema);

