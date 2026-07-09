import Integration from '../models/Integration.js';

export const fetchGoogleAnalyticsData = async (integrationId) => {
  try {
    const integration = await Integration.findById(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    // Simulate fetching Google Analytics data
    // In production, you would fetch real data using the decrypted accessToken
    const result = {
      revenue: 85400,
      orders: 310,
      products: 12,
    };

    // Update cached data on integration
    integration.cachedData = {
      lastFetched: new Date(),
      metrics: result,
    };
    
    await integration.save();
    return result;
  } catch (error) {
    console.error('Fetch Google Analytics data error:', error);
    throw error;
  }
};

export const fetchMailchimpData = async (integrationId) => {
  try {
    const integration = await Integration.findById(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    // Simulate fetching Mailchimp data
    // In production, you would fetch real data using the decrypted accessToken
    const result = {
      revenue: 34200,
      orders: 145,
      products: 8,
    };

    // Update cached data on integration
    integration.cachedData = {
      lastFetched: new Date(),
      metrics: result,
    };
    
    await integration.save();
    return result;
  } catch (error) {
    console.error('Fetch Mailchimp data error:', error);
    throw error;
  }
};
