const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const Post = require('../models/Post');

router.get('/search', auth, async (req, res) => {
  const q = req.query.q || '';
  const users = await User.find({ username: { $regex: q, $options: 'i' } })
    .select('username role avatarUrl')
    .limit(20);
  res.json(users);
});

router.get('/:id', auth, async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Full profile: return user info (no password), populated followers/following, and their posts
router.get('/:id/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash')
      .populate('followers', 'username avatarUrl')
      .populate('following', 'username avatarUrl');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ author: req.params.id })
      .populate('author', 'username avatarUrl role')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ user, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load profile' });
  }
});

router.post('/:id/follow', auth, async (req, res) => {
  const targetId = req.params.id;
  const me = req.user;
  if (me._id.equals(targetId)) {
    return res.status(400).json({ message: 'Cannot follow yourself' });
  }

  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ message: 'User not found' });

  const isFollowing = me.following.some((id) => id.equals(targetId));

  if (isFollowing) {
    me.following = me.following.filter((id) => !id.equals(targetId));
    target.followers = target.followers.filter((id) => !id.equals(me._id));
  } else {
    me.following.push(targetId);
    target.followers.push(me._id);
  }

  await me.save();
  await target.save();

  res.json({ following: me.following, followers: target.followers });
});

router.patch('/me', auth, async (req, res) => {
  try {
    const { username, email, bio, avatarUrl, password } = req.body;

    if (username) req.user.username = username;
    if (email) req.user.email = email;
    if (bio !== undefined) req.user.bio = bio;
    if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;

    if (password && password.trim()) {
      const hash = await bcrypt.hash(password.trim(), 10);
      req.user.passwordHash = hash;
    }

    await req.user.save();

    const safeUser = req.user.toObject();
    delete safeUser.passwordHash;
    res.json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
