const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/messages - Get all conversations
router.get('/', auth, async (req, res) => {
  try {
    const meId = new mongoose.Types.ObjectId(req.user._id);

    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ from: meId }, { to: meId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$from', meId] }, '$to', '$from']
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$to', meId] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    const userIds = messages.map((m) => m._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id username avatarUrl role')
      .lean();

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    const conversations = messages.map((m) => ({
      user: userMap[m._id.toString()] || { _id: m._id, username: 'Unknown' },
      lastMessage: {
        _id: m.lastMessage._id,
        text: m.lastMessage.text,
        mediaUrl: m.lastMessage.mediaUrl,
        post: m.lastMessage.post,
        createdAt: m.lastMessage.createdAt,
        fromMe: m.lastMessage.from.toString() === meId.toString()
      },
      unreadCount: m.unreadCount
    }));

    res.json(conversations);
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ message: 'Failed to get conversations' });
  }
});

// POST /api/messages/:otherUserId/read - Mark messages as read
router.post('/:otherUserId/read', auth, async (req, res) => {
  try {
    const otherId = req.params.otherUserId;
    const meId = req.user._id;

    const updated = await Message.updateMany(
      { from: otherId, to: meId, read: false },
      { $set: { read: true } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${otherId}`).emit('message:read', {
        from: meId.toString(),
        to: otherId.toString()
      });
    }

    res.json({ modified: updated.modifiedCount || updated.nModified || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to mark read' });
  }
});

// GET /api/messages/:otherUserId - Get messages with specific user
router.get('/:otherUserId', auth, async (req, res) => {
  try {
    const otherId = req.params.otherUserId;
    const meId = req.user._id;

    const messages = await Message.find({
      $or: [
        { from: meId, to: otherId },
        { from: otherId, to: meId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('post', 'caption imageUrl')
      .lean();

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get messages' });
  }
});

// POST /api/messages/:otherUserId - Send a message
router.post('/:otherUserId', auth, async (req, res) => {
  try {
    const otherId = req.params.otherUserId;
    const meId = req.user._id;
    const { text, postId, mediaUrl } = req.body;

    if (!text && !mediaUrl && !postId) {
      return res.status(400).json({ message: 'Text, media, or post required' });
    }

    const message = await Message.create({
      from: meId,
      to: otherId,
      text: text || '',
      post: postId || undefined,
      mediaUrl: mediaUrl || undefined
    });

    let populatedMessage = message.toObject();
    if (postId) {
      const Post = require('../models/Post');
      const post = await Post.findById(postId).select('caption imageUrl').lean();
      populatedMessage.post = post;
    }

    const io = req.app.get('io');
    const payload = {
      _id: populatedMessage._id,
      from: populatedMessage.from.toString(),
      to: populatedMessage.to.toString(),
      text: populatedMessage.text,
      post: populatedMessage.post,
      mediaUrl: populatedMessage.mediaUrl,
      read: false,
      createdAt: populatedMessage.createdAt
    };

    io.to(`user:${payload.from}`).to(`user:${payload.to}`).emit('message:new', payload);

    res.status(201).json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

module.exports = router;