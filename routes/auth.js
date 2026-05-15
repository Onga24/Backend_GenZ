// const express = require('express');
// const router = express.Router();
// const rateLimit = require('express-rate-limit');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const OTP = require('../models/OTP');
// const { generateOTPCode, sendOTPEmail } = require('../utils/sendOTP');
// const { protect } = require('../middleware/authMiddleware');
import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateOTPCode, sendOTPEmail } from '../utils/sendOTP.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();
// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many attempts, please try again in 15 minutes' },
});

// Generate JWT
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

/**
 * POST /api/auth/login
 * Standard login with email + password (after user has set a password)
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.password)
      return res.status(401).json({
        message: 'Password not set. Use "Forgot Password" to set one first.',
        needsPasswordSetup: true,
      });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password' });

    user.lastLogin = new Date();
    await user.save({ validateModifiedOnly: true });

    res.json({
      token: generateToken(user._id),
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Step 1: Check email exists → send OTP
 */
// router.post('/forgot-password', authLimiter, async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ message: 'Email required' });

//     const user = await User.findOne({ email: email.toLowerCase() });
//     if (!user) {
//       // Don't reveal whether email exists — same response either way
//       return res.json({
//         message: 'If this email is registered, an OTP has been sent.',
//       });
//     }

//     // Delete any existing OTP for this email
//     await OTP.deleteMany({ email: email.toLowerCase() });

//     const code = generateOTPCode();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//     await OTP.create({
//       email: email.toLowerCase(),
//       code,
//       expiresAt,
//     });

//     await sendOTPEmail(email, code, user.name);

//     res.json({ message: 'If this email is registered, an OTP has been sent.' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
//   }
// });

router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    console.log('1️⃣ Received email:', email);

    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('2️⃣ User found:', user ? user.name : 'NOT FOUND');

    if (!user) {
      return res.json({ message: 'If this email is registered, an OTP has been sent.' });
    }

    await OTP.deleteMany({ email: email.toLowerCase() });
    console.log('3️⃣ Old OTPs deleted');

    const code = generateOTPCode();
    console.log('4️⃣ Generated code:', code);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.create({ email: email.toLowerCase(), code, expiresAt });
    console.log('5️⃣ OTP saved to DB');

    await sendOTPEmail(email, code, user.name);
    console.log('6️⃣ Email sent ✅');

    res.json({ message: 'If this email is registered, an OTP has been sent.' });
  } catch (err) {
    console.error('❌ Error at step:', err.message);  // <-- tells us exactly where it crashed
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});
/**
 * POST /api/auth/verify-otp
 * Step 2: Verify OTP code → return a short-lived reset token
 */
router.post('/verify-otp', authLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ message: 'Email and OTP required' });

    const otpDoc = await OTP.findOne({
      email: email.toLowerCase(),
      verified: false,
    });

    if (!otpDoc)
      return res.status(400).json({ message: 'OTP not found or already used' });

    if (new Date() > otpDoc.expiresAt)
      return res.status(400).json({ message: 'OTP has expired. Request a new one.' });

    const isValid = await otpDoc.verifyCode(code);
    if (!isValid)
      return res.status(400).json({ message: 'Invalid OTP code' });

    // Mark as verified
    otpDoc.verified = true;
    await otpDoc.save();

    // Issue a short-lived reset token (5 min)
    const resetToken = jwt.sign(
      { email: email.toLowerCase(), purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({ resetToken, message: 'OTP verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * Step 3: Set new password using the reset token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword)
      return res.status(400).json({ message: 'Reset token and new password required' });

    if (newPassword.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Reset token is invalid or expired' });
    }

    if (decoded.purpose !== 'password-reset')
      return res.status(400).json({ message: 'Invalid reset token' });

    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword; // will be hashed by pre-save hook
    user.lastLogin = new Date();
    await user.save();

    // Clean up verified OTPs
    await OTP.deleteMany({ email: decoded.email, verified: true });

    res.json({
      token: generateToken(user._id),
      user,
      message: 'Password set successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current logged-in user
 */
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});


export default router;