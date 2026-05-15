// const express = require('express');
// const router = express.Router();
// const Post = require('../models/Post');
// const Comment = require('../models/Comment');
// const { protect, requireAdmin } = require('../middleware/authMiddleware');
import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
const router = express.Router();
/**
 * GET /api/posts
 * Admin: get all posts with user info
 * User: get only their own post(s)
 */
router.get('/', protect, async (req, res) => {
  try {
    let posts;

    if (req.user.role === 'admin') {
      posts = await Post.find()
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 });
    } else {
      posts = await Post.find({ user: req.user._id })
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 });
    }

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/posts/:id
 * Get single post — admin can get any, user only their own
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'user',
      'name email avatar'
    );

    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (
      req.user.role !== 'admin' &&
      post.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Include comments
    const comments = await Comment.find({ post: post._id })
      .populate('author', 'name avatar role')
      .sort({ createdAt: 1 });

    res.json({ post, comments });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/posts/:id
 * User can edit their own post message
 * Admin can edit any post
 */
router.patch('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (
      req.user.role !== 'admin' &&
      post.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const { message } = req.body;
    if (message) post.message = message;

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/posts/:id/heart
 * Toggle heart on a post (both admin and user)
 */
router.post('/:id/heart', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // User can only heart their own post's admin content
    // Admin can heart any post
    if (req.user.role === 'user' && post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userId = req.user._id;
    const alreadyHearted = post.hearts.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyHearted) {
      post.hearts = post.hearts.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      post.hearts.push(userId);
    }

    await post.save();
    res.json({ hearts: post.hearts.length, hearted: !alreadyHearted });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/posts/users/list
 * Admin only: get list of all users who have posts (for sidebar)
 */
router.get('/users/list', protect, requireAdmin, async (req, res) => {
  try {
    const users = await Post.aggregate([
      {
        $group: {
          _id: '$user',
          postCount: { $sum: 1 },
          latestPost: { $max: '$createdAt' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: '$userInfo._id',
          name: '$userInfo.name',
          email: '$userInfo.email',
          avatar: '$userInfo.avatar',
          postCount: 1,
          latestPost: 1,
        },
      },
      { $sort: { latestPost: -1 } },
    ]);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;