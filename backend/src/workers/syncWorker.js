import { Worker } from 'bullmq';
import redis from '../config/redis.js';
import { JOB_TYPES } from '../services/bullQueue.js';
import BackgroundJob from '../models/BackgroundJob.js';
import Integration from '../models/Integration.js';
import Notification from '../models/Notification.js';
import { fetchShopifyData } from '../services/shopifyService.js';
import { getIO } from '../config/socket.js';

let workerInstance = null;

export const initializeWorker = (io) => {
  if (workerInstance) {
    return workerInstance;
  }

  const worker = new Worker(
    'syncQueue',
    async (job) => {
      console.log(`[Worker] Processing job: ${job.name} (${job.id})`);
      
      try {
        const { organizationId, platform, integrationId, backgroundJobId } = job.data;

        // Update background job status to processing
        await BackgroundJob.findByIdAndUpdate(backgroundJobId, {
          status: 'processing',
        });

        // Emit sync started event
        io.to(`org:${organizationId}`).emit('sync:started', {
          platform,
          jobId: job.id,
          timestamp: new Date(),
        });

        // Create notification for sync started
        await Notification.create({
          organizationId,
          type: 'sync_started',
          title: `${platform} sync started`,
          message: `Sync job ${job.id} is processing`,
          metadata: { platform, jobId: job.id },
        });

        let result;
        
        // Process based on job type
        switch (job.name) {
          case JOB_TYPES.SYNC_SHOPIFY:
            result = await fetchShopifyData(integrationId);
            break;
          case JOB_TYPES.SYNC_GOOGLE_ANALYTICS:
            throw new Error('Google Analytics sync not implemented yet');
          case JOB_TYPES.SYNC_FACEBOOK_ADS:
            throw new Error('Facebook Ads sync not implemented yet');
          case JOB_TYPES.SYNC_MAILCHIMP:
            throw new Error('Mailchimp sync not implemented yet');
          default:
            throw new Error(`Unknown job type: ${job.name}`);
        }

        // Update background job to completed
        await BackgroundJob.findByIdAndUpdate(backgroundJobId, {
          status: 'completed',
          result,
          completedAt: new Date(),
        });

        // Create notification for sync completed
        const revenueFormatted = (result.revenue || 0).toLocaleString('en-IN');
        await Notification.create({
          organizationId,
          type: 'sync_success',
          title: `${platform} sync completed`,
          message: `₹${revenueFormatted} revenue, ${result.orders || 0} orders synced`,
          metadata: { 
            platform, 
            jobId: job.id, 
            summary: result,
          },
        });

        // Emit sync completed event
        io.to(`org:${organizationId}`).emit('sync:completed', {
          platform,
          jobId: job.id,
          summary: {
            revenue: result.revenue || 0,
            orders: result.orders || 0,
            products: result.products || 0,
          },
          timestamp: new Date(),
        });

        console.log(`[Worker] Job ${job.id} completed successfully`);
        return { success: true, data: result };
      } catch (error) {
        // Update background job to failed
        await BackgroundJob.findByIdAndUpdate(job.data.backgroundJobId, {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        });

        // Create notification for sync failed
        await Notification.create({
          organizationId: job.data.organizationId,
          type: 'sync_failed',
          title: `${job.data.platform} sync failed`,
          message: error.message,
          metadata: { 
            platform: job.data.platform, 
            jobId: job.id, 
            error: error.message,
          },
        });

        // Emit sync failed event
        io.to(`org:${job.data.organizationId}`).emit('sync:failed', {
          platform: job.data.platform,
          jobId: job.id,
          error: error.message,
          timestamp: new Date(),
        });

        console.error(`[Worker Error] Job ${job.id} failed:`, error.message);
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 1,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[Worker Error] Job ${job?.id} failed:`, error.message);
  });

  workerInstance = worker;
  return worker;
};

export const getWorker = () => workerInstance;