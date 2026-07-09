import React, { useState } from 'react';
import {
  useGetTeamMembersQuery,
  useInviteMemberMutation,
  useChangeRoleMutation,
  useRemoveMemberMutation,
} from '../features/team/teamSlice';
import Modal from '../components/ui/Modal';
import './Team.css';

const Team = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  
  const { data: members, isLoading, error, refetch } = useGetTeamMembersQuery();
  const [inviteMember, { isLoading: isInviting }] = useInviteMemberMutation();
  const [changeRole] = useChangeRoleMutation();
  const [removeMember] = useRemoveMemberMutation();

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await inviteMember({ email: inviteEmail, role: inviteRole }).unwrap();
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('viewer');
      refetch();
    } catch (err) {
      console.error('Failed to issue invitation:', err);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await changeRole({ userId, role }).unwrap();
      refetch();
    } catch (err) {
      console.error('Role update operation failed:', err);
    }
  };

  const handleRemove = async (userId) => {
    if (window.confirm('Confirm removal of user authorization?')) {
      try {
        await removeMember(userId).unwrap();
        refetch();
      } catch (err) {
        console.error('User removal operation failed:', err);
      }
    }
  };

  if (error) {
    return (
      <div className="team">
        <h1 className="team__title">Workspace Access Management</h1>
        <div className="team__error">
          <p>Failed to retrieve active users.</p>
          <button className="team__retry" onClick={refetch}>
            Retry Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="team">
      <div className="team__header">
        <div>
          <h1 className="team__title">Workspace Access Management</h1>
          <p className="team__subtitle">Administer workspace access privileges and role delegations.</p>
        </div>
        <button 
          className="team__invite-btn"
          onClick={() => setShowInviteModal(true)}
        >
          Invite User
        </button>
      </div>

      <div className="team__table-container">
        <table className="team__table">
          <thead>
            <tr>
              <th>Authorized Name</th>
              <th>Email Endpoint</th>
              <th>Role Privilege</th>
              <th>Authorization Date</th>
              <th>Administrative Control</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="team__loading">
                  Retrieving directory...
                </td>
              </tr>
            ) : members?.length === 0 ? (
              <tr>
                <td colSpan="5" className="team__empty">
                  No active user records found.
                </td>
              </tr>
            ) : (
              members?.map((member) => (
                <tr key={member._id}>
                  <td>
                    {member.firstName} {member.lastName}
                  </td>
                  <td>{member.email}</td>
                  <td>
                    <span className={`team__role team__role--${member.role}`}>
                      {member.role === 'admin' ? 'Administrator' : 'Viewer'}
                    </span>
                  </td>
                  <td>
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="team__actions">
                      <select
                        className="team__select"
                        value={member.role}
                        onChange={(e) => handleRoleChange(member._id, e.target.value)}
                        disabled={member.role === 'admin' && members.length === 1}
                      >
                        <option value="admin">Administrator</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        className="team__remove-btn"
                        onClick={() => handleRemove(member._id)}
                        disabled={member.role === 'admin' && members.length === 1}
                      >
                        Revoke Access
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Delegate Workspace Invite"
        confirmText={isInviting ? 'Dispatched...' : 'Send Invitation'}
        onConfirm={handleInvite}
      >
        <form onSubmit={handleInvite}>
          <div className="team__form-group">
            <label className="team__label">Target Email Address</label>
            <input
              type="email"
              className="team__input"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              placeholder="user@organization.com"
            />
          </div>
          <div className="team__form-group">
            <label className="team__label">Assigned Privilege Tier</label>
            <select
              className="team__select team__select--full"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="viewer">Viewer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Team;