import { Queue } from 'bullmq';
import redis from '../config/redis.js';
import BackgroundJob from '../models/BackgroundJob.js';

export const JOB_TYPES = {
  SYNC_SHOPIFY: 'sync-shopify',
  SYNC_GOOGLE_ANALYTICS: 'sync-google-analytics',
  SYNC_FACEBOOK_ADS: 'sync-facebook-ads',
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
      status: 'queued',
    });

    // Add job to BullMQ queue
    const job = await syncQueue.add(jobType, {
      organizationId,
      platform,
      integrationId,
      backgroundJobId: backgroundJob._id,
    });

    // Update BackgroundJob with BullMQ job ID
    backgroundJob.jobId = job.id;
    await backgroundJob.save();

    return {
      jobId: job.id,
      backgroundJobId: backgroundJob._id,
      status: 'queued',
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