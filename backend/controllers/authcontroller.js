// backend/controllers/authController.js
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { generateOTP, sendOTPEmail, verifyOTP } from '../services/otpService.js';
import axios from 'axios';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Verify Google ID Token using Google's API
const verifyGoogleToken = async (idToken) => {
  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    return response.data;
  } catch (error) {
    console.error('Google token verification failed:', error.response?.data || error.message);
    return null;
  }
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Password validation (min 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      authProvider: 'email',
    });

    // Generate OTP for verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.failedOTPAttempts = 0;
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, 'verification');
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue anyway - user is created
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email with OTP.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during signup',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user signed up with Google
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'Please use Google Sign In for this account',
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        token,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
export const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
  });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Send OTP for login/verification
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is locked
    if (user.otpLockUntil && user.otpLockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.otpLockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Please try again in ${remainingTime} minutes.`,
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.failedOTPAttempts = 0; // Reset on new OTP request
    await user.save();

    // Send OTP
    await sendOTPEmail(email, otp, 'verification');

    res.json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTPLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP',
      });
    }

    const user = await User.findOne({ email }).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is locked
    if (user.otpLockUntil && user.otpLockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.otpLockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Please try again in ${remainingTime} minutes.`,
      });
    }

    // Verify OTP
    const verification = verifyOTP(user.otp, user.otpExpiry, otp);

    if (!verification.valid) {
      // Increment failed attempts
      user.failedOTPAttempts = (user.failedOTPAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.failedOTPAttempts >= 5) {
        user.otpLockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 15 minutes.',
        });
      }

      await user.save();

      return res.status(400).json({
        success: false,
        message: verification.message,
        attemptsRemaining: 5 - user.failedOTPAttempts,
      });
    }

    // Success - Clear OTP and reset attempts
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.failedOTPAttempts = 0;
    user.otpLockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        token,
      },
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
    });
  }
};

// @desc    Forgot password - send reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset OTP has been sent.',
      });
    }

    // Check if user signed up with Google
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign In. Password reset is not available.',
      });
    }

    // Check if locked
    if (user.resetPasswordLockUntil && user.resetPasswordLockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.resetPasswordLockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many reset attempts. Please try again in ${remainingTime} minutes.`,
      });
    }

    // Generate reset OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = otpExpiry;
    user.failedResetAttempts = 0;
    await user.save();

    // Send OTP
    await sendOTPEmail(email, otp, 'reset');

    res.json({
      success: true,
      message: 'Password reset OTP sent to your email',
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reset OTP',
    });
  }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP, and new password',
      });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordOTPExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if locked
    if (user.resetPasswordLockUntil && user.resetPasswordLockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.resetPasswordLockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Please try again in ${remainingTime} minutes.`,
      });
    }

    // Verify reset OTP
    const verification = verifyOTP(user.resetPasswordOTP, user.resetPasswordOTPExpiry, otp);

    if (!verification.valid) {
      // Increment failed attempts
      user.failedResetAttempts = (user.failedResetAttempts || 0) + 1;

      // Lock after 5 failed attempts
      if (user.failedResetAttempts >= 5) {
        user.resetPasswordLockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpiry = undefined;
        await user.save();

        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 30 minutes.',
        });
      }

      await user.save();

      return res.status(400).json({
        success: false,
        message: verification.message,
        attemptsRemaining: 5 - user.failedResetAttempts,
      });
    }

    // Update password and clear reset data
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    user.failedResetAttempts = 0;
    user.resetPasswordLockUntil = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset',
    });
  }
};

// @desc    Google Signup/Login - UNIFIED & SECURE VERSION
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    console.log('📥 Google Auth Request');

    // Validate required fields
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required',
      });
    }

    // Verify token with Google
    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
    }

    const { email, name, sub: googleId } = googleUser;

    if (!email || !googleId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to get user information from Google',
      });
    }

    console.log('✅ Google token verified:', email);

    // Check if user exists by email or googleId
    let user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { googleId: googleId }
      ]
    });

    if (user) {
      // User exists - LOGIN
      console.log('👤 Existing user found:', user.email);
      
      // If user signed up with email/password first
      if (user.authProvider === 'email' && !user.googleId) {
        // Link Google account to existing email account
        user.googleId = googleId;
        user.authProvider = 'google'; // Switch to Google auth
        user.isVerified = true;
        await user.save();
        console.log('🔗 Linked Google account to existing email account');
      }
      // If user has different googleId (shouldn't happen, but safety check)
      else if (user.googleId && user.googleId !== googleId) {
        return res.status(403).json({
          success: false,
          message: 'This email is associated with a different Google account.',
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);

      console.log('✅ Google Login Success:', user.email);

      return res.json({
        success: true,
        message: 'Google login successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          authProvider: user.authProvider,
          token,
        },
      });
    } else {
      // User doesn't exist - SIGNUP
      console.log('🆕 Creating new Google user:', email);
      
      // Generate a random password (required by schema but won't be used)
      const randomPassword = Math.random().toString(36).slice(-12) + 'Goog!123';
      
      // Create new user
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        googleId: googleId,
        authProvider: 'google',
        password: randomPassword, // Required by schema
        isVerified: true, // Google accounts are pre-verified
        isActive: true,
        lastLogin: new Date(),
      });

      const token = generateToken(user._id);

      console.log('✅ Google Signup Success:', user.email);

      return res.status(201).json({
        success: true,
        message: 'Google signup successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          authProvider: user.authProvider,
          token,
        },
      });
    }
  } catch (error) {
    console.error('❌ Google auth error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `An account with this ${field} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during Google authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};