const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// Feed: show all posts (like Instagram explore/feed), with author and comment user populated
router.get('/feed', auth, async (req, res) => {
  const posts = await Post.find({})
    .populate('author', 'username avatarUrl role')
    .populate('comments.user', 'username')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(posts);
});

// Create post (creator/admin only)
router.post('/', auth, async (req, res) => {
  if (!['creator', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only creators/admins can post' });
  }

  const { caption, imageUrl, music } = req.body;
  const post = await Post.create({
    author: req.user._id,
    caption,
    imageUrl,
    music
  });

  const populated = await post.populate('author', 'username avatarUrl role');
  res.status(201).json(populated);
});

// Delete post (author or admin)
router.delete('/:id', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const isAuthor = post.author && post.author.equals(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isAuthor && !isAdmin) {
    return res.status(403).json({ message: 'Not allowed to delete this post' });
  }

  await post.deleteOne();
  res.json({ success: true });
});

// Like/unlike
router.post('/:id/like', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const already = post.likes.some((id) => id.equals(req.user._id));
  if (already) {
    post.likes = post.likes.filter((id) => !id.equals(req.user._id));
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();
  res.json({ likes: post.likes.length });
});

// Comment
router.post('/:id/comment', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Text required' });

  post.comments.push({ user: req.user._id, text, createdAt: new Date() });
  await post.save();

  // Return the last comment with user populated for convenience
  const populatedPost = await post.populate('comments.user', 'username');
  const lastComment = populatedPost.comments[populatedPost.comments.length - 1];
  res.status(201).json(lastComment);
});

// Share counter
router.post('/:id/share', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  post.shares += 1;
  await post.save();
  res.json({ shares: post.shares });
});

module.exports = router;
