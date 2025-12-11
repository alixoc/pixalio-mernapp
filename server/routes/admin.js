const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth, requireAdmin, async (req, res) => {
  const [users, posts, messages] = await Promise.all([
    User.find().lean(),
    Post.find().lean(),
    Message.find().lean()
  ]);

  const roles = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    { consumer: 0, creator: 0, admin: 0 }
  );

  const likeCount = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
  const commentCount = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);

  res.json({
    users: users.length,
    roles,
    posts: posts.length,
    likes: likeCount,
    comments: commentCount,
    messages: messages.length
  });
});

module.exports = router;
