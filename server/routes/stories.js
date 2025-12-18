const express = require('express');
const auth = require('../middleware/auth');
const Story = require('../models/Story');

const router = express.Router();

// Get all active stories (last 24 hours), grouped by author
router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /api/stories called by', req.user.username);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Story.find({ createdAt: { $gte: since } })
      .populate('author', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    // Group by author id
    const grouped = {};
    stories.forEach((s) => {
      const aid = s.author._id.toString();
      if (!grouped[aid]) grouped[aid] = { author: s.author, stories: [] };
      grouped[aid].stories.push(s);
    });

    console.log('Stories grouped:', Object.keys(grouped).length);
    res.json(Object.values(grouped));
  } catch (err) {
    console.error('Error in GET /api/stories:', err);
    res.status(500).json({ message: 'Failed to load stories' });
  }
});

// Get stories for a specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    console.log('GET /api/stories/:userId', req.params.userId, 'by', req.user.username);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Story.find({ author: req.params.userId, createdAt: { $gte: since } })
      .populate('author', 'username avatarUrl')
      .sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    console.error('Error in GET /api/stories/:userId:', err);
    res.status(500).json({ message: 'Failed to load user stories' });
  }
});

// Create a story
router.post('/', auth, async (req, res) => {
  try {
    const { mediaUrl, mediaType } = req.body;
    console.log('POST /api/stories by', req.user.username, 'mediaType:', mediaType);
    if (!mediaUrl) return res.status(400).json({ message: 'mediaUrl required' });

    const story = await Story.create({ author: req.user._id, mediaUrl, mediaType });
    const populated = await story.populate('author', 'username avatarUrl');

    // Emit real-time event so followers can see new story (optional)
    const io = req.app.get('io');
    if (io) {
      io.emit('story:created', { story: populated });
      console.log('Emitted story:created event');
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error('Error in POST /api/stories:', err);
    res.status(500).json({ message: 'Failed to create story' });
  }
});

// Mark story viewed by current user (optional)
router.post('/:id/view', auth, async (req, res) => {
  try {
    console.log('POST /api/stories/:id/view', req.params.id, 'by', req.user.username);
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    const me = req.user._id;
    if (!story.viewers.some((v) => v.equals(me))) {
      story.viewers.push(me);
      await story.save();
      console.log('Marked story as viewed for', req.user.username);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error in POST /api/stories/:id/view:', err);
    res.status(500).json({ message: 'Failed to mark viewed' });
  }
});

module.exports = router;
