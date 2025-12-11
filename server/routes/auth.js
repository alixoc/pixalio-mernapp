const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    
    if (password.length < 3) {
      return res.status(400).json({ message: 'Password must be at least 3 characters' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      if (existing.email === email) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      if (existing.username === username) {
        return res.status(400).json({ message: 'Username already in use' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      username, 
      email, 
      passwordHash, 
      role: role || 'consumer' 
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup: ' + err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email not found. Please sign up first.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login: ' + err.message });
  }
});

router.get('/me', auth, (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    username: u.username,
    email: u.email,
    role: u.role,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    followers: u.followers,
    following: u.following
  });
});

module.exports = router;
