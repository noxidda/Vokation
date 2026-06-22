import mongoose from 'mongoose';

const backgroundJobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  platform: {
    type: String,
    enum: ['shopify', 'google_analytics', 'facebook_ads', 'mailchimp'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'queued', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
  },
  error: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

const BackgroundJob = mongoose.model('BackgroundJob', backgroundJobSchema);
export default BackgroundJob;