import mongoose from 'mongoose';
 const postSchema = new mongoose.Schema(
  {
    // The person this post belongs to (from Excel import)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The message content from Excel
    message: {
      type: String,
      required: true,
      trim: true,
    },
    // Link from Excel — could be image or video URL
    mediaUrl: {
      type: String,
      default: '',
      trim: true,
    },
    // Auto-detected on import: 'image' | 'video' | 'youtube' | 'none'
    mediaType: {
      type: String,
      enum: ['image', 'video', 'youtube','pdf' , 'none'],
      default: 'none',
    },
    // Hearts from admin on this post
    hearts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);
export default mongoose.model('Post', postSchema);