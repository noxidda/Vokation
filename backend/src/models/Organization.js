import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  razorpayCustomerId: {
    type: String,
    index: true,
  },
  razorpaySubscriptionId: {
    type: String,
    sparse: true,
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'past_due', 'canceled', 'expired'],
    default: 'inactive',
  },
  subscriptionExpiry: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;