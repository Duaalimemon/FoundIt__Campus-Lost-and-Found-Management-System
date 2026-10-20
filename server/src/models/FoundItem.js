import mongoose from 'mongoose';
import { CATEGORIES, FOUND_STATUSES, PHONE_REGEX } from '../constants.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const foundItemSchema = new mongoose.Schema(
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
    foundLocation: {
      type: String,
      required: [true, 'Found location is required'],
      trim: true,
      minlength: [2, 'Found location must be at least 2 characters'],
      maxlength: [100, 'Found location cannot exceed 100 characters']
    },
    dateFound: {
      type: Date,
      required: [true, 'Date found is required']
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: FOUND_STATUSES,
        message: '{VALUE} is not a valid found status'
      },
      default: 'available'
    },
    storageLocation: {
      type: String,
      required: [true, 'Storage location is required'],
      trim: true,
      minlength: [2, 'Storage location must be at least 2 characters'],
      maxlength: [100, 'Storage location cannot exceed 100 characters']
    },
    finderName: {
      type: String,
      required: [true, 'Finder name is required'],
      trim: true,
      minlength: [2, 'Finder name must be at least 2 characters'],
      maxlength: [80, 'Finder name cannot exceed 80 characters']
    },
    finderEmail: {
      type: String,
      required: [true, 'Finder email is required'],
      trim: true,
      lowercase: true,
      maxlength: [100, 'Finder email cannot exceed 100 characters'],
      validate: {
        validator: (v) => emailRegex.test(v),
        message: 'Finder email is invalid'
      }
    },
    finderPhone: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (v) {
          return !v || PHONE_REGEX.test(v);
        },
        message: 'Finder phone number format is invalid'
      }
    },
    verificationNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Verification notes cannot exceed 500 characters']
    }
  },
  {
    timestamps: true,
    collection: 'founditems'
  }
);

// Indexes per Section 5.9: default ordering and list filters
foundItemSchema.index({ createdAt: -1, category: 1, status: 1 });

export const FoundItem = mongoose.model('FoundItem', foundItemSchema);
