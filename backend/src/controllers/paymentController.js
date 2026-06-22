import razorpay from '../config/razorpay.js';
import Payment from '../models/Payment.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { logAction, AUDIT_ACTIONS } from '../services/auditService.js';
import crypto from 'crypto';

// Create a one-time payment order
export const createOrder = async (req, res) => {
  try {
    const { plan = 'pro' } = req.body;
    const { organizationId, user } = req;
    
    // Check if organization is already on Pro
    const organization = await Organization.findById(organizationId);
    if (organization.subscriptionTier === 'pro') {
      return res.status(400).json({
        error: true,
        message: 'Organization is already on Pro plan',
      });
    }
    
    // Only Pro is available for purchase
    if (plan !== 'pro') {
      return res.status(400).json({
        error: true,
        message: 'Invalid plan selected',
      });
    }
    
    // Create Razorpay order
    const amount = 99900; // ₹999 in paise
    const receipt = `rcpt_${organizationId}_${Date.now()}`;
    
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        organizationId: organizationId.toString(),
        plan: 'pro',
        userId: user._id.toString(),
        email: user.email,
      },
      payment_capture: 1, // Auto-capture
    });
    
    // Save payment record
    const payment = await Payment.create({
      organizationId,
      userId: user._id,
      razorpayOrderId: order.id,
      amount,
      currency: 'INR',
      plan: 'pro',
      status: 'created',
    });
    
    // Log the action
    await logAction({
      organizationId,
      userId: user._id,
      action: AUDIT_ACTIONS.SUBSCRIPTION_UPGRADED,
      resource: 'order',
      resourceId: order.id,
      details: { amount, plan: 'pro' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to create payment order',
    });
  }
};

// Verify payment after successful checkout
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const { organizationId, user } = req;
    
    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        error: true,
        message: 'Invalid payment signature',
      });
    }
    
    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({
        error: true,
        message: 'Payment record not found',
      });
    }
    
    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'paid';
    payment.completedAt = new Date();
    await payment.save();
    
    // Update organization to Pro
    const organization = await Organization.findById(organizationId);
    organization.subscriptionTier = 'pro';
    organization.subscriptionStatus = 'active';
    
    // Set expiry (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    organization.subscriptionExpiry = expiryDate;
    await organization.save();
    
    // Log the upgrade
    await logAction({
      organizationId,
      userId: user._id,
      action: AUDIT_ACTIONS.SUBSCRIPTION_UPGRADED,
      resource: 'organization',
      resourceId: organization._id,
      details: { tier: 'pro', expiry: expiryDate },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(200).json({
      success: true,
      tier: 'pro',
      expiry: expiryDate,
      message: 'Welcome to Pro!',
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to verify payment',
    });
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const { organizationId } = req;
    
    const payments = await Payment.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.status(200).json(payments);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch payment history',
    });
  }
};

// Get subscription status
export const getSubscriptionStatus = async (req, res) => {
  try {
    const { organizationId } = req;
    
    const organization = await Organization.findById(organizationId);
    
    res.status(200).json({
      tier: organization.subscriptionTier,
      status: organization.subscriptionStatus,
      expiry: organization.subscriptionExpiry,
      isActive: organization.subscriptionTier === 'pro' && organization.subscriptionStatus === 'active',
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch subscription status',
    });
  }
};