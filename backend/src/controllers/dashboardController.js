import Integration from '../models/Integration.js';
import BackgroundJob from '../models/BackgroundJob.js';

export const getDashboardMetrics = async (req, res) => {
  try {
    const { organizationId } = req;

    // Get all active integrations
    const integrations = await Integration.find({
      organizationId,
      isActive: true,
    });

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalVisitors = 0;
    let conversionRate = 0;
    let lastSynced = null;
    const platforms = [];

    // Check for any pending sync jobs
    const pendingJobs = await BackgroundJob.countDocuments({
      organizationId,
      status: { $in: ['queued', 'processing'] },
    });

    // Process each integration
    for (const integration of integrations) {
      const platformData = {
        platform: integration.platform,
        status: 'connected',
        lastSynced: integration.cachedData?.lastFetched || null,
      };

      if (integration.cachedData?.metrics) {
        const metrics = integration.cachedData.metrics;
        
        if (integration.platform === 'shopify') {
          platformData.revenue = metrics.revenue || 0;
          platformData.orders = metrics.orders || 0;
          platformData.products = metrics.products || 0;
          
          totalRevenue += metrics.revenue || 0;
          totalOrders += metrics.orders || 0;
        }
        
        // Update lastSynced if this integration is newer
        if (integration.cachedData.lastFetched) {
          if (!lastSynced || new Date(integration.cachedData.lastFetched) > new Date(lastSynced)) {
            lastSynced = integration.cachedData.lastFetched;
          }
        }
      } else {
        platformData.revenue = 0;
        platformData.orders = 0;
      }

      platforms.push(platformData);
    }

    // Calculate conversion rate (visitors will come from Google Analytics in Month 3)
    const visitors = 0; // Placeholder
    
    if (visitors > 0 && totalOrders > 0) {
      conversionRate = (totalOrders / visitors) * 100;
    }

    // Get revenue trend from Shopify (if connected)
    let revenueTrend = [];
    let ordersTrend = [];
    let conversionTrend = [];
    
    const shopifyIntegration = integrations.find(i => i.platform === 'shopify');
    
    if (shopifyIntegration?.cachedData?.metrics?.last30Days) {
      revenueTrend = shopifyIntegration.cachedData.metrics.last30Days.map(day => ({
        date: day.date,
        revenue: day.revenue || 0,
      }));
      
      ordersTrend = shopifyIntegration.cachedData.metrics.last30Days.map(day => ({
        date: day.date,
        orders: day.orders || 0,
      }));
      
      // Conversion trend (placeholder until Google Analytics)
      conversionTrend = shopifyIntegration.cachedData.metrics.last30Days.map(day => ({
        date: day.date,
        rate: 0,
        visitors: 0,
      }));
    }

    res.status(200).json({
      totalRevenue,
      totalOrders,
      totalVisitors: visitors,
      conversionRate,
      lastSynced,
      platforms,
      revenueTrend,
      ordersTrend,
      conversionTrend,
      hasIntegrations: integrations.length > 0,
      hasPendingJobs: pendingJobs > 0,
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch dashboard metrics',
    });
  }
};