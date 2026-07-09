import { Queue } from 'bullmq';
import redis from '../config/redis.js';
import BackgroundJob from '../models/BackgroundJob.js';
import Notification from '../models/Notification.js';
import { fetchShopifyData } from './shopifyService.js';
import { fetchGoogleAnalyticsData, fetchMailchimpData } from './analyticsService.js';
import { getIO } from '../config/socket.js';

export const JOB_TYPES = {
  SYNC_SHOPIFY: 'sync-shopify',
  SYNC_GOOGLE_ANALYTICS: 'sync-google-analytics',
  SYNC_MAILCHIMP: 'sync-mailchimp',
};

const syncQueue = new Queue('syncQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const queueSyncJob = async (organizationId, platform, integrationId) => {
  try {
    const jobType = Object.values(JOB_TYPES).find(type => 
      type === `sync-${platform}`
    );

    if (!jobType) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    // Create BackgroundJob document
    const backgroundJob = await BackgroundJob.create({
      jobId: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      platform,
      status: 'pending',
    });

    // Check if Redis is connected
    if (redis.status !== 'ready') {
      console.log(`[Queue] Redis is not ready (status: ${redis.status}). Processing job in-process.`);
      
      // Execute in next tick to not block HTTP response
      setImmediate(async () => {
        try {
          // Update status to processing
          backgroundJob.status = 'processing';
          await backgroundJob.save();

          // Emit sync:started
          const io = getIO();
          if (io) {
            io.to(`org:${organizationId}`).emit('sync:started', {
              platform,
              jobId: backgroundJob.jobId,
              timestamp: new Date(),
            });
          }

          // Create notification
          await Notification.create({
            organizationId,
            type: 'sync_started',
            title: `${platform} sync started`,
            message: `Sync job ${backgroundJob.jobId} is processing`,
            metadata: { platform, jobId: backgroundJob.jobId },
          });

          // Run the sync
          let result;
          if (platform === 'shopify') {
            result = await fetchShopifyData(integrationId);
          } else if (platform === 'google_analytics') {
            result = await fetchGoogleAnalyticsData(integrationId);
          } else if (platform === 'mailchimp') {
            result = await fetchMailchimpData(integrationId);
          } else {
            throw new Error(`${platform} sync not implemented yet`);
          }

          // Update status to completed
          backgroundJob.status = 'completed';
          backgroundJob.result = result;
          backgroundJob.completedAt = new Date();
          await backgroundJob.save();

          // Create notification for success
          const revenueFormatted = (result.revenue || 0).toLocaleString('en-IN');
          await Notification.create({
            organizationId,
            type: 'sync_success',
            title: `${platform} sync completed`,
            message: `₹${revenueFormatted} revenue, ${result.orders || 0} orders synced`,
            metadata: { 
              platform, 
              jobId: backgroundJob.jobId, 
              summary: result,
            },
          });

          // Emit sync:completed
          if (io) {
            io.to(`org:${organizationId}`).emit('sync:completed', {
              platform,
              jobId: backgroundJob.jobId,
              summary: {
                revenue: result.revenue || 0,
                orders: result.orders || 0,
                products: result.products || 0,
              },
              timestamp: new Date(),
            });
          }
        } catch (jobErr) {
          console.error(`[Queue] In-process job ${backgroundJob.jobId} failed:`, jobErr.message);
          backgroundJob.status = 'failed';
          backgroundJob.error = jobErr.message;
          backgroundJob.completedAt = new Date();
          await backgroundJob.save();

          // Create notification for failure
          await Notification.create({
            organizationId,
            type: 'sync_failed',
            title: `${platform} sync failed`,
            message: jobErr.message,
            metadata: { 
              platform, 
              jobId: backgroundJob.jobId, 
              error: jobErr.message,
            },
          });

          // Emit sync:failed
          if (io) {
            io.to(`org:${organizationId}`).emit('sync:failed', {
              platform,
              jobId: backgroundJob.jobId,
              error: jobErr.message,
              timestamp: new Date(),
            });
          }
        }
      });

      return {
        jobId: backgroundJob.jobId,
        backgroundJobId: backgroundJob._id,
        status: 'pending',
      };
    }

    // Add job to BullMQ queue
    const job = await syncQueue.add(jobType, {
      organizationId,
      platform,
      integrationId,
      backgroundJobId: backgroundJob._id,
    });

    // Update BackgroundJob with BullMQ job ID
    backgroundJob.jobId = job.id;
    backgroundJob.status = 'pending';
    await backgroundJob.save();

    return {
      jobId: job.id,
      backgroundJobId: backgroundJob._id,
      status: 'pending',
    };
  } catch (error) {
    console.error('Queue sync job error:', error);
    throw error;
  }
};

export const getJobStatus = async (jobId) => {
  try {
    const job = await syncQueue.getJob(jobId);
    
    if (!job) {
      return { status: 'not_found' };
    }

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    const error = job.failedReason;

    return {
      status: state,
      progress,
      result,
      error,
    };
  } catch (error) {
    console.error('Get job status error:', error);
    throw error;
  }
};

export const getRecentJobs = async (organizationId, limit = 20) => {
  try {
    const jobs = await BackgroundJob.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return jobs;
  } catch (error) {
    console.error('Get recent jobs error:', error);
    throw error;
  }
};

export const retryJob = async (backgroundJobId) => {
  try {
    const backgroundJob = await BackgroundJob.findById(backgroundJobId);
    
    if (!backgroundJob) {
      throw new Error('Background job not found');
    }

    // Create new job
    const result = await queueSyncJob(
      backgroundJob.organizationId,
      backgroundJob.platform,
      backgroundJob.integrationId
    );

    return result;
  } catch (error) {
    console.error('Retry job error:', error);
    throw error;
  }
};

export default syncQueue;