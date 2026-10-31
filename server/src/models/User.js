import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [100, 'Email cannot exceed 100 characters'],
      validate: {
        validator: (v) => emailRegex.test(v),
        message: 'Email format is invalid'
      }
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['student'],
        message: '{VALUE} is not an authorized user role'
      },
      default: 'student'
    },
    authProvider: {
      type: String,
      required: [true, 'Authentication provider is required'],
      enum: {
        values: ['local', 'google'],
        message: '{VALUE} is not a valid authentication provider'
      },
      default: 'local'
    },
    passwordHash: {
      type: String,
      default: '',
      validate: {
        validator: function (v) {
          if (this.authProvider !== 'google') {
            if (this._password !== undefined) {
              if (typeof this._password !== 'string' || this._password.length < 8) {
                this.invalidate('password', 'Password must be at least 8 characters');
                return false;
              }
              return true;
            }
            if (!v) {
              this.invalidate('password', 'Password is required for local accounts');
              return false;
            }
            return true;
          }
          return true;
        },
        message: 'Password is required for local accounts'
      }
    },
    googleId: {
      type: String,
      trim: true,
      default: undefined
    },
    passwordResetToken: {
      type: String,
      select: false,
      default: undefined
    },
    passwordResetExpires: {
      type: Date,
      select: false,
      default: undefined
    },
    passwordResetLastRequestedAt: {
      type: Date,
      select: false,
      default: undefined
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Virtual for plaintext password handling during creation/update
userSchema
  .virtual('password')
  .set(function (value) {
    this._password = value;
  })
  .get(function () {
    return this._password;
  });


// Pre-save hook: Hash password with bcrypt before persisting
userSchema.pre('save', async function () {
  if (this._password) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this._password, salt);
    this._password = undefined;
  }
});

// Instance method: Verify candidate password against stored bcrypt hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash || !candidatePassword) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Exclude passwordHash and internal versioning from normal serialization
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.passwordResetLastRequestedAt;
    delete ret.__v;
    return ret;
  }
});

userSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.passwordResetLastRequestedAt;
    delete ret.__v;
    return ret;
  }
});

// Indexes per Section 4: unique lowercase email and sparse unique googleId/resetToken
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

export const User = mongoose.model('User', userSchema);
