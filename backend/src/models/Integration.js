import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema({
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
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
  },
  platformStoreId: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  cachedData: {
    lastFetched: Date,
    metrics: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  webhookId: {
    type: String,
  },
}, {
  timestamps: true,
});

// Compound index for unique organization + platform
integrationSchema.index({ organizationId: 1, platform: 1 }, { unique: true });

const Integration = mongoose.model('Integration', integrationSchema);
export default Integration;