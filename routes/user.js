// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const { protect, requireAdmin } = require('../middleware/authMiddleware');
 import express from 'express';
 import User from '../models/User.js';
 import { protect, requireAdmin } from '../middleware/authMiddleware.js';
 const router = express.Router();

/**
 * PATCH /api/users/profile
 * Update own profile (name, bio, avatar)
 */
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save({ validateModifiedOnly: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/users
 * Admin only: list all users
 */
router.get('/', protect, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/users/:id/role
 * Admin only: change user role
 */
router.patch('/:id/role', protect, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;