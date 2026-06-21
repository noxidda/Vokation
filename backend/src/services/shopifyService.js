import Integration from '../models/Integration.js';
import { decrypt } from './encryptionService.js';

const SHOPIFY_API_VERSION = '2024-01';

const shopifyRequest = async (shopDomain, accessToken, endpoint, method = 'GET', body = null) => {
  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Shopify request error:', error);
    throw error;
  }
};

export const fetchShopifyData = async (integrationId) => {
  try {
    const integration = await Integration.findById(integrationId);
    
    if (!integration) {
      throw new Error('Integration not found');
    }

    const shopDomain = integration.platformStoreId;
    const accessToken = decrypt(integration.accessToken);

    // Fetch orders
    const ordersData = await shopifyRequest(
      shopDomain,
      accessToken,
      '/orders.json?status=any&limit=250'
    );

    const orders = ordersData.orders || [];
    
    // Calculate metrics
    let totalRevenue = 0;
    let totalOrders = orders.length;
    
    orders.forEach(order => {
      totalRevenue += parseFloat(order.total_price || 0);
    });

    // Fetch product count
    const productCountData = await shopifyRequest(
      shopDomain,
      accessToken,
      '/products/count.json'
    );

    const productCount = productCountData.count || 0;

    // Fetch last 30 days orders for trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

    const recentOrdersData = await shopifyRequest(
      shopDomain,
      accessToken,
      `/orders.json?status=any&created_at_min=${dateFilter}&limit=250`
    );

    const recentOrders = recentOrdersData.orders || [];

    // Group orders by day
    const dailyData = {};
    const today = new Date();
    
    // Initialize last 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { revenue: 0, orders: 0 };
    }

    // Fill with actual data
    recentOrders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const dateStr = orderDate.toISOString().split('T')[0];
      
      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += parseFloat(order.total_price || 0);
        dailyData[dateStr].orders += 1;
      }
    });

    // Convert to array
    const last30Days = Object.entries(dailyData).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }));

    const metrics = {
      revenue: totalRevenue,
      orders: totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      products: productCount,
      last30Days,
    };

    // Update integration with cached data
    integration.cachedData = {
      lastFetched: new Date(),
      metrics,
    };

    await integration.save();

    return metrics;
  } catch (error) {
    console.error('Fetch Shopify data error:', error);
    throw error;
  }
};

export const disconnectShopify = async (integrationId) => {
  try {
    const integration = await Integration.findById(integrationId);
    
    if (!integration) {
      throw new Error('Integration not found');
    }

    // Optionally revoke token with Shopify
    // For now, just delete the integration
    await Integration.findByIdAndDelete(integrationId);

    return { success: true };
  } catch (error) {
    console.error('Disconnect Shopify error:', error);
    throw error;
  }
};