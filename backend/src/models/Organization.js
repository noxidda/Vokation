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
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'past_due', 'canceled'],
    default: 'inactive',
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