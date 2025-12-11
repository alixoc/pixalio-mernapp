const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// Mark messages from other user as read
router.post('/:otherUserId/read', auth, async (req, res) => {
  try {
    const otherId = req.params.otherUserId;
    const meId = req.user._id;
    const updated = await Message.updateMany({ from: otherId, to: meId, read: false }, { $set: { read: true } });

    // Notify sender(s) that messages were read
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${otherId}`).emit('message:read', { from: meId.toString(), to: otherId.toString() });
    }

    res.json({ modified: updated.modifiedCount || updated.nModified || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to mark read' });
  }
});

router.get('/:otherUserId', auth, async (req, res) => {
  const otherId = req.params.otherUserId;
  const meId = req.user._id;

  const messages = await Message.find({
    $or: [
      { from: meId, to: otherId },
      { from: otherId, to: meId }
    ]
  })
    .sort({ createdAt: 1 })
    .lean();

  res.json(messages);
});

router.post('/:otherUserId', auth, async (req, res) => {
  const otherId = req.params.otherUserId;
  const meId = req.user._id;
  const { text, postId, mediaUrl } = req.body;

  if (!text && !mediaUrl) return res.status(400).json({ message: 'Text or media required' });

  const message = await Message.create({
    from: meId,
    to: otherId,
    text,
    post: postId || undefined,
    mediaUrl: mediaUrl || undefined
  });

  const io = req.app.get('io');
  const payload = {
    _id: message._id,
    from: message.from.toString(),
    to: message.to.toString(),
    text: message.text,
    post: message.post,
    mediaUrl: message.mediaUrl,
    createdAt: message.createdAt
  };

  io.to(`user:${payload.from}`).to(`user:${payload.to}`).emit('message:new', payload);

  res.status(201).json(message);
});

module.exports = router;
