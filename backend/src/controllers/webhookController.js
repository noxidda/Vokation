import crypto from 'crypto';
import WebhookEvent from '../models/WebhookEvent.js';
import Payment from '../models/Payment.js';
import Organization from '../models/Organization.js';
import { logAction, AUDIT_ACTIONS } from '../services/auditService.js';
import { getIO } from '../config/socket.js';

export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(400).json({
        error: true,
        message: 'Invalid webhook signature',
      });
    }
    
    const event = req.body.event;
    const payload = req.body;
    
    // Store webhook event
    await WebhookEvent.create({
      event,
      payload,
      signature,
      processed: false,
      receivedAt: new Date(),
    });
    
    // Process event based on type
    switch (event) {
      case 'order.paid':
        await handleOrderPaid(payload);
        break;
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      case 'subscription.charged':
        await handleSubscriptionCharged(payload);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
    
    // Mark event as processed
    await WebhookEvent.findOneAndUpdate(
      { _id: (await WebhookEvent.findOne({ event, receivedAt: { $gte: new Date(Date.now() - 5000) } }))?._id },
      { processed: true }
    );
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to process webhook',
    });
  }
};

// Webhook event handlers
const handleOrderPaid = async (payload) => {
  try {
    const order = payload.payload.order.entity;
    const payment = payload.payload.payment.entity;
    
    const organizationId = order.notes.organizationId;
    const userId = order.notes.userId;
    
    // Find payment record
    const paymentRecord = await Payment.findOne({ razorpayOrderId: order.id });
    if (paymentRecord) {
      paymentRecord.razorpayPaymentId = payment.id;
      paymentRecord.status = 'paid';
      paymentRecord.completedAt = new Date();
      paymentRecord.paymentMethod = payment.method;
      await paymentRecord.save();
    }
    
    // Upgrade organization
    const organization = await Organization.findById(organizationId);
    if (organization && organization.subscriptionTier !== 'pro') {
      organization.subscriptionTier = 'pro';
      organization.subscriptionStatus = 'active';
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      organization.subscriptionExpiry = expiryDate;
      await organization.save();
      
      // Log the action
      await logAction({
        organizationId,
        userId,
        action: AUDIT_ACTIONS.SUBSCRIPTION_UPGRADED,
        resource: 'organization',
        resourceId: organization._id,
        details: { tier: 'pro', expiry: expiryDate, source: 'webhook' },
        ipAddress: 'webhook',
        userAgent: 'razorpay',
      });
      
      // Emit socket event
      const io = getIO();
      io.to(`org:${organizationId}`).emit('subscription:updated', {
        tier: 'pro',
        status: 'active',
        expiry: expiryDate,
      });
    }
  } catch (error) {
    console.error('Handle order paid error:', error);
    throw error;
  }
};

const handlePaymentCaptured = async (payload) => {
  // Similar to handleOrderPaid
  console.log('Payment captured:', payload);
};

const handlePaymentFailed = async (payload) => {
  console.log('Payment failed:', payload);
  // Log payment failure
};

const handleSubscriptionCharged = async (payload) => {
  // Handle recurring payment
  console.log('Subscription charged:', payload);
};

const handleSubscriptionCancelled = async (payload) => {
  // Handle subscription cancellation
  console.log('Subscription cancelled:', payload);
};