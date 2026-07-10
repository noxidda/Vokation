import Integration from '../models/Integration.js';
import AuditLog from '../models/AuditLog.js';
import { encrypt } from '../services/encryptionService.js';
import { queueSyncJob, getRecentJobs, retryJob } from '../services/bullQueue.js';
import crypto from 'crypto';
import Organization from '../models/Organization.js';

// Store OAuth states temporarily (in production, use Redis)
const oauthStates = new Map();

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

    // Support local mock/test shop connection
    if (shop === 'mock' || shop === 'test' || shop.includes('mock') || shop.includes('test')) {
      const state = crypto.randomBytes(16).toString('hex');
      oauthStates.set(state, {
        organizationId,
        timestamp: Date.now(),
      });
      res.redirect(`/api/integrations/shopify/callback?code=mock_code&shop=${shop}&state=${state}`);
      return;
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state temporarily
    oauthStates.set(state, {
      organizationId,
      timestamp: Date.now(),
    });

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
    const stateData = oauthStates.get(state);
    if (!stateData) {
      return res.status(400).json({
        error: true,
        message: 'Invalid or expired state parameter',
      });
    }

    // Remove used state
    oauthStates.delete(state);

    // Bypass verification and token exchange if it is a mock connection
    if (code === 'mock_code') {
      const encryptedToken = encrypt('mock_shopify_token');
      const integration = await Integration.create({
        organizationId: stateData.organizationId,
        platform: 'shopify',
        accessToken: encryptedToken,
        platformStoreId: shop,
        isActive: true,
      });

      await AuditLog.create({
        organizationId: stateData.organizationId,
        userId: req.userId || 'system',
        action: 'connected_integration',
        metadata: { platform: 'shopify', storeId: shop },
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/integrations?success=shopify`);
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
      organizationId: stateData.organizationId,
      platform: 'shopify',
      accessToken: encryptedToken,
      refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
      platformStoreId: shop,
      isActive: true,
    });

    // Create audit log
    await AuditLog.create({
      organizationId: stateData.organizationId,
      userId: req.userId || 'system',
      action: 'connected_integration',
      metadata: { platform: 'shopify', storeId: shop },
    });

    // Redirect back to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/integrations?success=shopify`);
  } catch (error) {
    console.error('Shopify callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/integrations?error=shopify`);
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

export const connectIntegration = async (req, res) => {
  try {
    const { platform } = req.params;
    const { organizationId } = req;
    
    // Check if organization is on Free tier
    const organization = await Organization.findById(organizationId);
    
    if (organization.subscriptionTier === 'free') {
      // Count existing integrations
      const integrationCount = await Integration.countDocuments({
        organizationId,
        isActive: true,
      });
      
      if (integrationCount >= 1) {
        return res.status(403).json({
          error: true,
          message: 'Free plan allows only 1 platform connection. Upgrade to Pro for unlimited connections.',
        });
      }
    }
    
    // Default manual connection logic for custom platforms (optional fallback)
    const integration = await Integration.create({
      organizationId,
      platform,
      accessToken: encrypt('manual_token'),
      platformStoreId: `${platform}_manual`,
      isActive: true,
    });

    res.status(200).json({
      message: 'Integration connected successfully',
      integration,
    });
  } catch (error) {
    console.error('Connect integration error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to connect integration',
    });
  }
};

// Google Analytics Connect
export const initiateGoogleConnect = async (req, res) => {
  try {
    const { organizationId } = req;
    const state = crypto.randomBytes(16).toString('hex');
    
    oauthStates.set(state, {
      organizationId,
      timestamp: Date.now(),
    });

    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const scope = 'https://www.googleapis.com/auth/analytics.readonly';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}&access_type=offline&prompt=consent`;

    res.redirect(authUrl);
  } catch (error) {
    console.error('Initiate Google Analytics connect error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/integrations?error=google_analytics`);
  }
};

// Google Analytics Callback
export const googleCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const { code, state } = req.query;

    const stateData = oauthStates.get(state);
    if (!stateData) {
      return res.redirect(`${frontendUrl}/integrations?error=google_analytics`);
    }

    oauthStates.delete(state);

    // Exchange auth code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error || 'Failed to exchange token with Google');
    }

    const encryptedToken = encrypt(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null;

    // Save integration
    await Integration.create({
      organizationId: stateData.organizationId,
      platform: 'google_analytics',
      accessToken: encryptedToken,
      refreshToken: encryptedRefreshToken,
      platformStoreId: 'Google Analytics Property',
      isActive: true,
    });

    // Create audit log
    await AuditLog.create({
      organizationId: stateData.organizationId,
      userId: req.userId || 'system',
      action: 'connected_integration',
      metadata: { platform: 'google_analytics' },
    });

    res.redirect(`${frontendUrl}/integrations?success=google_analytics`);
  } catch (error) {
    console.error('Google Analytics callback error:', error);
    res.redirect(`${frontendUrl}/integrations?error=google_analytics`);
  }
};

// Mailchimp Connect
export const initiateMailchimpConnect = async (req, res) => {
  try {
    const { organizationId } = req;
    const state = crypto.randomBytes(16).toString('hex');
    
    oauthStates.set(state, {
      organizationId,
      timestamp: Date.now(),
    });

    const redirectUri = process.env.MAILCHIMP_REDIRECT_URI;
    const clientId = process.env.MAILCHIMP_CLIENT_ID;
    
    const authUrl = `https://login.mailchimp.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    res.redirect(authUrl);
  } catch (error) {
    console.error('Initiate Mailchimp connect error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/integrations?error=mailchimp`);
  }
};

// Mailchimp Callback
export const mailchimpCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const { code, state } = req.query;

    const stateData = oauthStates.get(state);
    if (!stateData) {
      return res.redirect(`${frontendUrl}/integrations?error=mailchimp`);
    }

    oauthStates.delete(state);

    // Exchange auth code for tokens
    const tokenResponse = await fetch('https://login.mailchimp.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.MAILCHIMP_CLIENT_ID,
        client_secret: process.env.MAILCHIMP_CLIENT_SECRET,
        code,
        redirect_uri: process.env.MAILCHIMP_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error || 'Failed to exchange token with Mailchimp');
    }

    const accessToken = tokenData.access_token;
    
    // Fetch Mailchimp metadata to get dc (data center)
    const metadataResponse = await fetch('https://login.mailchimp.com/oauth2/metadata', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const metadata = await metadataResponse.json();
    const dc = metadata.dc || 'us1';
    const accountName = metadata.accountname || 'Mailchimp Account';

    const encryptedToken = encrypt(accessToken);

    // Save integration
    await Integration.create({
      organizationId: stateData.organizationId,
      platform: 'mailchimp',
      accessToken: encryptedToken,
      platformStoreId: accountName,
      isActive: true,
    });

    // Create audit log
    await AuditLog.create({
      organizationId: stateData.organizationId,
      userId: req.userId || 'system',
      action: 'connected_integration',
      metadata: { platform: 'mailchimp', account: accountName },
    });

    res.redirect(`${frontendUrl}/integrations?success=mailchimp`);
  } catch (error) {
    console.error('Mailchimp callback error:', error);
    res.redirect(`${frontendUrl}/integrations?error=mailchimp`);
  }
};