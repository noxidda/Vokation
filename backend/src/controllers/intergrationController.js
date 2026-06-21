import Integration from '../models/Integration.js';
import AuditLog from '../models/AuditLog.js';
import { encrypt } from '../services/encryptionService.js';
import { queueSyncJob, getRecentJobs, retryJob } from '../services/bullQueue.js';
import { fetchShopifyData } from '../services/shopifyService.js';
import crypto from 'crypto';

// Shopify OAuth
export const initiateShopifyConnect = async (req, res) => {
  try {
    const { organizationId } = req;
    const shop = req.query.shop;

    if (!shop) {
      return res.status(400).json({
        error: true,
        message: 'Shop parameter is required',
      });
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state in session (for now, we'll use a simple in-memory store)
    // In production, use Redis for this
    req.session = req.session || {};
    req.session.shopifyState = state;
    req.session.organizationId = organizationId;

    const redirectUri = process.env.SHOPIFY_REDIRECT_URI;
    const clientId = process.env.SHOPIFY_API_KEY;
    const scopes = 'read_orders,read_products,read_analytics';

    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;

    res.redirect(authUrl);
  } catch (error) {
    console.error('Initiate Shopify connect error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to initiate Shopify connection',
    });
  }
};

export const shopifyCallback = async (req, res) => {
  try {
    const { code, shop, state, hmac } = req.query;

    // Verify state
    if (state !== req.session?.shopifyState) {
      return res.status(400).json({
        error: true,
        message: 'Invalid state parameter',
      });
    }

    // Verify HMAC
    const queryString = Object.keys(req.query)
      .filter(key => key !== 'hmac')
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&');

    const generatedHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(queryString)
      .digest('hex');

    if (hmac !== generatedHmac) {
      return res.status(400).json({
        error: true,
        message: 'Invalid HMAC signature',
      });
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error || 'Failed to exchange token');
    }

    // Encrypt token
    const encryptedToken = encrypt(tokenData.access_token);

    // Save integration
    const integration = await Integration.create({
      organizationId: req.session.organizationId,
      platform: 'shopify',
      accessToken: encryptedToken,
      refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
      platformStoreId: shop,
      isActive: true,
    });

    // Create audit log
    await AuditLog.create({
      organizationId: req.session.organizationId,
      userId: req.userId,
      action: 'connected_integration',
      metadata: { platform: 'shopify', storeId: shop },
    });

    // Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/integrations?success=shopify`);
  } catch (error) {
    console.error('Shopify callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/integrations?error=shopify`);
  }
};

export const disconnectIntegration = async (req, res) => {
  try {
    const { platform } = req.params;
    const { organizationId, user } = req;

    const integration = await Integration.findOneAndDelete({
      organizationId,
      platform,
    });

    if (!integration) {
      return res.status(404).json({
        error: true,
        message: 'Integration not found',
      });
    }

    // Create audit log
    await AuditLog.create({
      organizationId,
      userId: user._id,
      action: 'disconnected_integration',
      metadata: { platform },
    });

    res.status(200).json({
      message: 'Integration disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect integration error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to disconnect integration',
    });
  }
};

export const getIntegrations = async (req, res) => {
  try {
    const { organizationId } = req;

    const integrations = await Integration.find({
      organizationId,
    }).select('-accessToken -refreshToken');

    res.status(200).json(integrations);
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch integrations',
    });
  }
};

export const syncIntegration = async (req, res) => {
  try {
    const { platform } = req.params;
    const { organizationId } = req;

    // Find integration
    const integration = await Integration.findOne({
      organizationId,
      platform,
      isActive: true,
    });

    if (!integration) {
      return res.status(404).json({
        error: true,
        message: 'Integration not found or inactive',
      });
    }

    // Queue sync job
    const result = await queueSyncJob(
      organizationId,
      platform,
      integration._id
    );

    res.status(202).json({
      message: 'Sync job queued successfully',
      jobId: result.jobId,
      status: 'queued',
    });
  } catch (error) {
    console.error('Sync integration error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to sync integration',
    });
  }
};

export const getSyncHistory = async (req, res) => {
  try {
    const { platform } = req.params;
    const { organizationId } = req;

    const jobs = await getRecentJobs(organizationId, 10);
    
    // Filter by platform if provided
    const filteredJobs = platform 
      ? jobs.filter(job => job.platform === platform)
      : jobs;

    res.status(200).json(filteredJobs);
  } catch (error) {
    console.error('Get sync history error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch sync history',
    });
  }
};

export const retryFailedJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { organizationId } = req;

    const result = await retryJob(jobId);

    res.status(200).json({
      message: 'Job retry queued',
      jobId: result.jobId,
      status: 'queued',
    });
  } catch (error) {
    console.error('Retry job error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to retry job',
    });
  }
};