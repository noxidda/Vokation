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
      console.error('Failed to invite member:', err);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await changeRole({ userId, role }).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to change role:', err);
    }
  };

  const handleRemove = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(userId).unwrap();
        refetch();
      } catch (err) {
        console.error('Failed to remove member:', err);
      }
    }
  };

  if (error) {
    return (
      <div className="team">
        <h1 className="team__title">Team</h1>
        <div className="team__error">
          <p>Failed to load team members</p>
          <button className="team__retry" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="team">
      <div className="team__header">
        <div>
          <h1 className="team__title">Team</h1>
          <p className="team__subtitle">Manage your organization members</p>
        </div>
        <button 
          className="team__invite-btn"
          onClick={() => setShowInviteModal(true)}
        >
          + Invite Member
        </button>
      </div>

      <div className="team__table-container">
        <table className="team__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="team__loading">
                  Loading...
                </td>
              </tr>
            ) : members?.length === 0 ? (
              <tr>
                <td colSpan="5" className="team__empty">
                  No members found
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
                      {member.role}
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
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        className="team__remove-btn"
                        onClick={() => handleRemove(member._id)}
                        disabled={member.role === 'admin' && members.length === 1}
                      >
                        Remove
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
        title="Invite Team Member"
        confirmText={isInviting ? 'Sending...' : 'Send Invitation'}
        onConfirm={handleInvite}
      >
        <form onSubmit={handleInvite}>
          <div className="team__form-group">
            <label className="team__label">Email Address</label>
            <input
              type="email"
              className="team__input"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              placeholder="colleague@company.com"
            />
          </div>
          <div className="team__form-group">
            <label className="team__label">Role</label>
            <select
              className="team__select team__select--full"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Team;