import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
  },
  razorpayPaymentId: {
    type: String,
    sparse: true,
  },
  razorpaySignature: {
    type: String,
  },
  subscriptionId: {
    type: String,
    sparse: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  plan: {
    type: String,
    enum: ['pro'],
    required: true,
  },
  status: {
    type: String,
    enum: ['created', 'attempted', 'paid', 'failed', 'refunded'],
    default: 'created',
  },
  paymentMethod: {
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

// Index for faster queries
paymentSchema.index({ organizationId: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;