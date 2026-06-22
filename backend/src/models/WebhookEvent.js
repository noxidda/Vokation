import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    index: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  signature: {
    type: String,
  },
  processed: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
  },
  receivedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// TTL index to auto-delete after 30 days
webhookEventSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 2592000 });

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
export default WebhookEvent;