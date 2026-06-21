import BackgroundJob from '../models/BackgroundJob.js';
import { getJobStatus, retryJob } from '../services/bullQueue.js';

export const getJobs = async (req, res) => {
  try {
    const { organizationId } = req;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { organizationId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await BackgroundJob.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BackgroundJob.countDocuments(query);

    res.status(200).json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch jobs',
    });
  }
};

export const getJobStatusById = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { organizationId } = req;

    // Find in database first
    const backgroundJob = await BackgroundJob.findOne({
      jobId,
      organizationId,
    });

    if (!backgroundJob) {
      return res.status(404).json({
        error: true,
        message: 'Job not found',
      });
    }

    // Get real-time status from BullMQ
    const status = await getJobStatus(jobId);

    res.status(200).json({
      ...backgroundJob.toObject(),
      currentStatus: status,
    });
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch job status',
    });
  }
};

export const retryJobById = async (req, res) => {
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