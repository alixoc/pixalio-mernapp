// ...existing code...
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    // Make author optional to avoid accidental Post validation errors during unrelated flows (like signup).
    // Posts created from the application routes still set author explicitly.
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    caption: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    music: {
      id: { type: String, default: '' },
      title: { type: String, default: '' },
      url: { type: String, default: '' }
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    shares: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Export model
module.exports = mongoose.models.Post || mongoose.model('Post', postSchema);
// ...existing code...