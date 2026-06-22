import React, { useState, useEffect } from 'react';
import { useGetAuditLogsQuery, useExportAuditLogsMutation } from '../features/audit/auditSlice';
import { useGetTeamMembersQuery } from '../features/team/teamSlice';
import StatusBadge from '../components/ui/StatusBadge';
import { useSocket } from '../context/SocketContext';
import './AuditLog.css';

const AuditLog = () => {
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    from: '',
    to: '',
    page: 1,
  });
  const [expandedRow, setExpandedRow] = useState(null);
  const [newEntryIndicator, setNewEntryIndicator] = useState(false);
  
  const { data: auditData, isLoading, error, refetch } = useGetAuditLogsQuery(filters);
  const { data: teamMembers } = useGetTeamMembersQuery();
  const [exportLogs] = useExportAuditLogsMutation();
  const { socket } = useSocket();

  // Listen for new audit entries
  useEffect(() => {
    if (!socket) return;

    const handleNewAudit = (data) => {
      if (data.organizationId === localStorage.getItem('orgId')) {
        setNewEntryIndicator(true);
        // Auto-refresh after 2 seconds
        setTimeout(() => {
          refetch();
          setNewEntryIndicator(false);
        }, 2000);
      }
    };

    socket.on('audit:new_entry', handleNewAudit);

    return () => {
      socket.off('audit:new_entry', handleNewAudit);
    };
  }, [socket, refetch]);

  const actions = [
    { value: '', label: 'All Actions' },
    { value: 'platform.connected', label: 'Platform Connected' },
    { value: 'platform.disconnected', label: 'Platform Disconnected' },
    { value: 'platform.synced', label: 'Platform Synced' },
    { value: 'team.member_invited', label: 'Team Member Invited' },
    { value: 'team.role_changed', label: 'Role Changed' },
    { value: 'team.member_removed', label: 'Member Removed' },
    { value: 'subscription.upgraded', label: 'Subscription Upgraded' },
    { value: 'settings.updated', label: 'Settings Updated' },
  ];

  const getActionBadge = (action) => {
    const categories = {
      'platform': { color: 'maroon' },
      'team': { color: 'warning' },
      'subscription': { color: 'success' },
      'settings': { color: 'info' },
      'dashboard': { color: 'info' },
    };
    
    const category = action.split('.')[0];
    const variant = categories[category]?.color || 'info';
    
    const labels = {
      'platform.connected': 'Connected',
      'platform.disconnected': 'Disconnected',
      'platform.synced': 'Synced',
      'team.member_invited': 'Member Invited',
      'team.role_changed': 'Role Changed',
      'team.member_removed': 'Member Removed',
      'subscription.upgraded': 'Upgraded',
      'settings.updated': 'Settings Updated',
    };
    
    return {
      label: labels[action] || action,
      variant,
    };
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleExport = async () => {
    try {
      const blob = await exportLogs(filters).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (error) {
    return (
      <div className="audit">
        <h1 className="audit__title">Audit Log</h1>
        <div className="audit__error">
          <p>Failed to load audit logs</p>
          <button className="audit__retry" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="audit">
      <div className="audit__header">
        <div>
          <h1 className="audit__title">Audit Log</h1>
          <p className="audit__subtitle">Track all activity in your organization</p>
        </div>
        <button className="audit__export-btn" onClick={handleExport}>
          Export Logs
        </button>
      </div>

      {newEntryIndicator && (
        <div className="audit__new-entry">
          New audit entries available
        </div>
      )}

      <div className="audit__filters">
        <select
          className="audit__filter-select"
          value={filters.action}
          onChange={(e) => handleFilterChange('action', e.target.value)}
        >
          {actions.map(action => (
            <option key={action.value} value={action.value}>
              {action.label}
            </option>
          ))}
        </select>

        <select
          className="audit__filter-select"
          value={filters.userId}
          onChange={(e) => handleFilterChange('userId', e.target.value)}
        >
          <option value="">All Users</option>
          {teamMembers?.map(member => (
            <option key={member._id} value={member._id}>
              {member.firstName} {member.lastName}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="audit__filter-date"
          value={filters.from}
          onChange={(e) => handleFilterChange('from', e.target.value)}
          placeholder="From"
        />

        <input
          type="date"
          className="audit__filter-date"
          value={filters.to}
          onChange={(e) => handleFilterChange('to', e.target.value)}
          placeholder="To"
        />

        <button className="audit__filter-apply" onClick={() => refetch()}>
          Apply Filters
        </button>

        <button 
          className="audit__filter-clear"
          onClick={() => {
            setFilters({ action: '', userId: '', from: '', to: '', page: 1 });
            refetch();
          }}
        >
          Clear
        </button>
      </div>

      <div className="audit__table-container">
        <table className="audit__table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="audit__loading">
                  Loading...
                </td>
              </tr>
            ) : auditData?.logs?.length === 0 ? (
              <tr>
                <td colSpan="5" className="audit__empty">
                  No audit logs found
                </td>
              </tr>
            ) : (
              auditData?.logs?.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <React.Fragment key={log._id}>
                    <tr 
                      className="audit__row"
                      onClick={() => setExpandedRow(expandedRow === log._id ? null : log._id)}
                    >
                      <td className="audit__timestamp">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        {log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'Unknown'}
                      </td>
                      <td>
                        <StatusBadge variant={badge.variant}>
                          {badge.label}
                        </StatusBadge>
                      </td>
                      <td className="audit__resource">
                        {log.resource || '—'}
                        {log.resourceId && (
                          <span className="audit__resource-id">
                            ({log.resourceId})
                          </span>
                        )}
                      </td>
                      <td className="audit__ip">{log.ipAddress || '—'}</td>
                    </tr>
                    {expandedRow === log._id && (
                      <tr className="audit__expanded">
                        <td colSpan="5">
                          <div className="audit__details">
                            <strong>Details:</strong>
                            <pre className="audit__json">
                              {JSON.stringify(log.details || {}, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {auditData?.pagination && auditData.pagination.totalPages > 1 && (
        <div className="audit__pagination">
          <button
            className="audit__page-btn"
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page === 1}
          >
            Previous
          </button>
          <span className="audit__page-info">
            Page {filters.page} of {auditData.pagination.totalPages}
          </span>
          <button
            className="audit__page-btn"
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page === auditData.pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLog;