// backend/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ✅ Contact Message Schema
const contactMessageSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new'
  },
  adminReply: {
    type: String,
    trim: true
  },
  repliedAt: {
    type: Date
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      required: false, // Optional for backward compatibility
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true,
      match: [
        /^[0-9]{10}$/,
        'Please add a valid 10-digit phone number',
      ],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // ✅ NEW: Authentication provider tracking
    authProvider: {
      type: String,
      enum: ['email', 'google'],
      default: 'email',
    },
    // ✅ NEW: Google ID for Google authentication
    googleId: {
      type: String,
      sparse: true, // Allows null/undefined but enforces uniqueness when present
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // OTP for email verification
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    // ✅ NEW: OTP rate limiting
    failedOTPAttempts: {
      type: Number,
      default: 0,
    },
    otpLockUntil: {
      type: Date,
    },
    // OTP for password reset
    resetPasswordOTP: {
      type: String,
      select: false,
    },
    resetPasswordOTPExpiry: {
      type: Date,
      select: false,
    },
    // ✅ NEW: Password reset rate limiting
    failedResetAttempts: {
      type: Number,
      default: 0,
    },
    resetPasswordLockUntil: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    // ✅ Contact Messages Array
    contactMessages: [contactMessageSchema],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ googleId: 1 }); // ✅ NEW: Index for Google authentication
userSchema.index({ 'contactMessages.status': 1 });
userSchema.index({ 'contactMessages.createdAt': -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // ✅ NEW: Only hash password if it's modified and exists (important for Google auth)
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  // ✅ NEW: Check if password exists (Google users may not have password)
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  return await this.save({ validateBeforeSave: false });
};

// Method to check if OTP is valid
userSchema.methods.isOTPValid = function (otp, otpExpiry) {
  if (!otp || !otpExpiry) return false;
  if (new Date() > otpExpiry) return false;
  return true;
};

// ✅ NEW: Clean up expired locks on query
userSchema.pre(/^find/, function (next) {
  const now = new Date();
  
  // This will update documents that have expired locks
  this.model.updateMany(
    {
      $or: [
        { otpLockUntil: { $lt: now } },
        { resetPasswordLockUntil: { $lt: now } },
      ],
    },
    {
      $unset: {
        otpLockUntil: 1,
        resetPasswordLockUntil: 1,
      },
      $set: {
        failedOTPAttempts: 0,
        failedResetAttempts: 0,
      },
    }
  ).exec();
  
  next();
});

// ✅ NEW: Transform output - remove sensitive data
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  
  // Remove sensitive fields
  delete user.password;
  delete user.otp;
  delete user.otpExpiry;
  delete user.resetPasswordOTP;
  delete user.resetPasswordOTPExpiry;
  delete user.failedOTPAttempts;
  delete user.failedResetAttempts;
  delete user.otpLockUntil;
  delete user.resetPasswordLockUntil;
  delete user.__v;
  
  return user;
};

// Method to add contact message
userSchema.methods.addContactMessage = async function (subject, message) {
  this.contactMessages.push({
    subject: subject.trim(),
    message: message.trim(),
    status: 'new'
  });
  return await this.save();
};

// Method to get unread message count
userSchema.methods.getUnreadMessageCount = function () {
  return this.contactMessages.filter(msg => msg.status === 'new').length;
};

// Method to mark message as read
userSchema.methods.markMessageAsRead = async function (messageId) {
  const message = this.contactMessages.id(messageId);
  if (message && message.status === 'new') {
    message.status = 'read';
    return await this.save();
  }
  return null;
};

// Static method to get all contact messages (for admin)
userSchema.statics.getAllContactMessages = async function (filters = {}) {
  const { status, limit = 50, skip = 0 } = filters;
  
  const matchStage = status ? { 'contactMessages.status': status } : {};
  
  return await this.aggregate([
    { $match: { 'contactMessages.0': { $exists: true } } }, // Only users with messages
    { $unwind: '$contactMessages' },
    { $match: matchStage },
    {
      $project: {
        userId: '$_id',
        userName: '$name',
        userEmail: '$email',
        userPhone: '$phone',
        messageId: '$contactMessages._id',
        subject: '$contactMessages.subject',
        message: '$contactMessages.message',
        status: '$contactMessages.status',
        adminReply: '$contactMessages.adminReply',
        repliedAt: '$contactMessages.repliedAt',
        createdAt: '$contactMessages.createdAt',
        updatedAt: '$contactMessages.updatedAt'
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);
}; 

const User = mongoose.model('User', userSchema);

export default User;