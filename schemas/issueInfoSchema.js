const mongoose = require('mongoose');

const IssueInfoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    governmentBody: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'Pending', // Default status for new issues
    },
    images: [
      {
        type: String, // URLs or file paths to the images
      },
    ],
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserInfo',
      required: true,
    },
  },
  { timestamps: true }
);

const IssueInfo = mongoose.model('IssueInfo', IssueInfoSchema);

module.exports = IssueInfo;
