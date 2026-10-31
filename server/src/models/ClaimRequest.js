import mongoose from 'mongoose';
import { CLAIM_STATUSES, PHONE_REGEX } from '../constants.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const claimRequestSchema = new mongoose.Schema(
  {
    foundItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoundItem',
      required: [true, 'Referenced found item ID is required'],
      immutable: [true, 'Referenced found item cannot be changed once created']
    },
    claimantName: {
      type: String,
      required: [true, 'Claimant name is required'],
      trim: true,
      minlength: [2, 'Claimant name must be at least 2 characters'],
      maxlength: [80, 'Claimant name cannot exceed 80 characters']
    },
    claimantEmail: {
      type: String,
      required: [true, 'Claimant email is required'],
      trim: true,
      lowercase: true,
      maxlength: [100, 'Claimant email cannot exceed 100 characters'],
      validate: {
        validator: (v) => emailRegex.test(v),
        message: 'Claimant email is invalid'
      }
    },
    claimantPhone: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (v) {
          return !v || PHONE_REGEX.test(v);
        },
        message: 'Claimant phone number format is invalid'
      }
    },
    proofDescription: {
      type: String,
      required: [true, 'Proof description is required'],
      trim: true,
      minlength: [20, 'Proof description must be at least 20 characters'],
      maxlength: [1000, 'Proof description cannot exceed 1000 characters']
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: CLAIM_STATUSES,
        message: '{VALUE} is not a valid claim status'
      },
      default: 'pending'
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Admin note cannot exceed 500 characters'],
      validate: {
        validator: function (v) {
          // If status is rejected, adminNote is required and must be >= 5 characters (Section 5.5)
          if (this.status === 'rejected') {
            return typeof v === 'string' && v.trim().length >= 5;
          }
          return true;
        },
        message: 'An admin note of at least 5 characters is required when rejecting a claim'
      }
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: undefined
    }
  },
  {
    timestamps: true,
    collection: 'claimrequests'
  }
);

// Indexes per Section 5.9
claimRequestSchema.index({ foundItem: 1, status: 1 });
claimRequestSchema.index({ foundItem: 1, claimantEmail: 1 });
claimRequestSchema.index({ claimedBy: 1 });

export const ClaimRequest = mongoose.model('ClaimRequest', claimRequestSchema);

