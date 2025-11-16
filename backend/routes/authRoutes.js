import express from 'express';
import {
  signup,
  login,
  logout,
  getMe,
  sendOTP,
  verifyOTPLogin,
  forgotPassword,
  resetPassword,
  googleAuth,
} from '../controllers/authcontroller.js';

import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// OTP routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTPLogin);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google authentication (handles both signup and login)
router.post('/google', googleAuth);
router.post('/google-signup', googleAuth); // Backward compatibility
router.post('/google-login', googleAuth); // Backward compatibility

// Protected routes
router.get('/me', protect, getMe);

export default router;