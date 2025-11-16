// backend/routes/configRoutes.js
import express from 'express';
const router = express.Router();

// @desc    Get Firebase config for frontend
// @route   GET /api/config/firebase
// @access  Public
router.get('/firebase', (req, res) => {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCENVymYaQIpR22IkXJD3cvbSqkb-6FijI",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "nyaybharat-27853.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "nyaybharat-27853",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "nyaybharat-27853.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "288530460991",
    appId: process.env.FIREBASE_APP_ID || "1:288530460991:web:3436409f057c2ee70e638a",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-QDDDGEQ5SS"
  };

  res.json(firebaseConfig);
});

export default router;