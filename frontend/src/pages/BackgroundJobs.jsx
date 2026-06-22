import React, { useState } from 'react';
import { useGetJobsQuery, useRetryJobMutation } from '../features/jobs/jobSlice';
import StatusBadge from '../components/ui/StatusBadge';
import './BackgroundJobs.css';

const BackgroundJobs = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useGetJobsQuery({ 
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
  });
  const [retryJob] = useRetryJobMutation();

  const statuses = ['all', 'queued', 'processing', 'completed', 'failed'];

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'processing': return 'warning';
      default: return 'info';
    }
  };

  const handleRetry = async (jobId) => {
    try {
      await retryJob(jobId).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return '—';
    const duration = new Date(end) - new Date(start);
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
  };

  if (error) {
    return (
      <div className="jobs">
        <h1 className="jobs__title">Sync Jobs</h1>
        <div className="jobs__error">
          <p>Failed to load jobs</p>
          <button className="jobs__retry" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="jobs">
      <h1 className="jobs__title">Sync Jobs</h1>
      <p className="jobs__subtitle">Monitor and manage sync jobs for your organization</p>

      <div className="jobs__filters">
        {statuses.map((status) => (
          <button
            key={status}
            className={`jobs__filter-btn ${statusFilter === status ? 'jobs__filter-btn--active' : ''}`}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="jobs__table-container">
        <table className="jobs__table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Status</th>
              <th>Created</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="jobs__loading">
                  Loading...
                </td>
              </tr>
            ) : data?.jobs?.length === 0 ? (
              <tr>
                <td colSpan="5" className="jobs__empty">
                  No jobs found
                </td>
              </tr>
            ) : (
              data?.jobs?.map((job) => (
                <tr key={job._id}>
                  <td className="jobs__platform">{job.platform}</td>
                  <td>
                    <StatusBadge variant={getStatusVariant(job.status)}>
                      {job.status}
                    </StatusBadge>
                  </td>
                  <td>{new Date(job.createdAt).toLocaleString()}</td>
                  <td>{formatDuration(job.createdAt, job.completedAt)}</td>
                  <td>
                    {job.status === 'failed' && (
                      <button
                        className="jobs__retry-btn"
                        onClick={() => handleRetry(job._id)}
                      >
                        Retry
                      </button>
                    )}
                    {job.status === 'processing' && (
                      <span className="jobs__processing">Processing...</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.pagination && data.pagination.pages > 1 && (
        <div className="jobs__pagination">
          <button
            className="jobs__page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="jobs__page-info">
            Page {page} of {data.pagination.pages}
          </span>
          <button
            className="jobs__page-btn"
            onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
            disabled={page === data.pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default BackgroundJobs;