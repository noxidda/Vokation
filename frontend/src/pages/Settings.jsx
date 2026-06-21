import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import './Settings.css';

const Settings = () => {
  const [orgName, setOrgName] = useState('My Company');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSaveOrgName = () => {
    setIsEditing(true);
    // Simulate API call
    setTimeout(() => {
      setIsEditing(false);
      alert('Organization name updated successfully!');
    }, 1000);
  };

  const handleDeleteOrganization = () => {
    setShowDeleteModal(false);
    if (window.confirm('Are you absolutely sure? This cannot be undone.')) {
      // Delete organization logic here
      alert('Organization deleted');
    }
  };

  return (
    <div className="settings">
      <h1 className="settings__title">Settings</h1>

      <div className="settings__section">
        <h2 className="settings__subtitle">Organization</h2>
        <Card>
          <div className="settings__field">
            <label className="settings__label">Organization Name</label>
            <div className="settings__field-row">
              <input
                type="text"
                className="settings__input"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter organization name"
              />
              <button
                className="settings__save-btn"
                onClick={handleSaveOrgName}
                disabled={isEditing}
              >
                {isEditing ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div className="settings__section">
        <h2 className="settings__subtitle">Subscription</h2>
        <Card>
          <div className="settings__subscription">
            <div className="settings__subscription-info">
              <span className="settings__subscription-tier">Free Plan</span>
              <span className="settings__subscription-status">Inactive</span>
            </div>
            <button className="settings__upgrade-btn">
              Upgrade to Pro
            </button>
          </div>
        </Card>
      </div>

      <div className="settings__section settings__section--danger">
        <h2 className="settings__subtitle settings__subtitle--danger">Danger Zone</h2>
        <Card>
          <div className="settings__danger">
            <div className="settings__danger-info">
              <p className="settings__danger-title">Delete Organization</p>
              <p className="settings__danger-description">
                Permanently delete your organization and all associated data.
                This action cannot be undone.
              </p>
            </div>
            <button
              className="settings__danger-btn"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Organization
            </button>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Organization"
        confirmText="Delete"
        onConfirm={handleDeleteOrganization}
      >
        <p className="settings__modal-text">
          Are you sure you want to delete your organization? This action is permanent
          and cannot be undone. All data will be lost.
        </p>
        <p className="settings__modal-text settings__modal-text--warning">
          Type <strong>DELETE</strong> in the field below to confirm.
        </p>
        <input
          type="text"
          className="settings__input settings__input--modal"
          placeholder="Type DELETE to confirm"
        />
      </Modal>
    </div>
  );
};

export default Settings;