import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import './Settings.css';

const Settings = () => {
  const [orgName, setOrgName] = useState('Workspace Node');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleSaveOrgName = () => {
    setIsEditing(true);
    setTimeout(() => {
      setIsEditing(false);
      alert('Workspace configurations updated successfully.');
    }, 1000);
  };

  const handleDeleteOrganization = () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Verification term mismatch. Action aborted.');
      return;
    }
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    if (window.confirm('Final warning: Confirm immediate termination of this workspace?')) {
      alert('Workspace terminated.');
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteConfirmText('');
    setShowDeleteModal(false);
  };

  const isDeleteDisabled = deleteConfirmText !== 'DELETE';

  return (
    <div className="settings">
      <h1 className="settings__title">Workspace Preferences</h1>

      <div className="settings__section">
        <h2 className="settings__subtitle">Identity Settings</h2>
        <Card>
          <div className="settings__field">
            <label className="settings__label">Workspace Label</label>
            <div className="settings__field-row">
              <input
                type="text"
                className="settings__input"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter workspace label"
              />
              <button
                className="settings__save-btn"
                onClick={handleSaveOrgName}
                disabled={isEditing}
              >
                {isEditing ? 'Applying...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div className="settings__section">
        <h2 className="settings__subtitle">Service Agreement</h2>
        <Card>
          <div className="settings__subscription">
            <div className="settings__subscription-info">
              <span className="settings__subscription-tier">Standard Tier</span>
              <span className="settings__subscription-status">Active</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="settings__section settings__section--danger">
        <h2 className="settings__subtitle settings__subtitle--danger">Restricted Zone</h2>
        <Card>
          <div className="settings__danger">
            <div className="settings__danger-info">
              <p className="settings__danger-title">Terminate Workspace</p>
              <p className="settings__danger-description">
                Permanently decommission this workspace and erase all associated repositories, metrics, and users.
                This action is irreversible.
              </p>
            </div>
            <button
              className="settings__danger-btn"
              onClick={() => setShowDeleteModal(true)}
            >
              Terminate Workspace
            </button>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        title="Confirm Workspace Termination"
        confirmText="Terminate"
        onConfirm={isDeleteDisabled ? null : handleDeleteOrganization}
      >
        <p className="settings__modal-text">
          Are you sure you want to terminate your workspace? All operational data will be permanently erased.
        </p>
        <p className="settings__modal-text settings__modal-text--warning">
          Type <strong>DELETE</strong> in the field below to confirm.
        </p>
        <input
          type="text"
          className="settings__input settings__input--modal"
          placeholder="Type DELETE to confirm"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default Settings;