// const express = require('express');
// const router = express.Router();
// const Comment = require('../models/Comment');
// const Post = require('../models/Post');
// const { protect, requireAdmin } = require('../middleware/authMiddleware');

import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import express from 'express';

const router = express.Router();
/**
 * POST /api/comments/:postId
 * Admin adds a comment to any post
 * User can also reply (to their own post only)
 */
router.post('/:postId', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // User can only comment on their own post
    if (
      req.user.role === 'user' &&
      post.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { text } = req.body;
    if (!text || text.trim() === '')
      return res.status(400).json({ message: 'Comment text required' });

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text: text.trim(),
    });

    const populated = await comment.populate('author', 'name avatar role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/comments/:postId
 * Get all comments for a post
 */
router.get('/:postId', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (
      req.user.role === 'user' &&
      post.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'name avatar role')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/comments/:id/heart
 * Toggle heart on a comment (both admin and user can heart)
 */
router.post('/:id/heart', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate('post');
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // User can only heart comments on their own post
    if (
      req.user.role === 'user' &&
      comment.post.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userId = req.user._id;
    const alreadyHearted = comment.hearts.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyHearted) {
      comment.hearts = comment.hearts.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      comment.hearts.push(userId);
    }

    await comment.save();
    res.json({ hearts: comment.hearts.length, hearted: !alreadyHearted });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/comments/:id
 * Admin can delete any comment, user can delete their own
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (
      req.user.role !== 'admin' &&
      comment.author.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;