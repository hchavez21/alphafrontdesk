import React, { useEffect, useState } from 'react';
import { User } from '../../types';

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (newUser: User) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onAddUser }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Name is required.');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      alert('PIN must be exactly 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      alert('PINs do not match.');
      return;
    }
    onAddUser({ name: name.trim(), pin });
    setName('');
    setPin('');
    setConfirmPin('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <form className="log-form" onSubmit={handleSubmit}>
          <h2>Add New Staff Member</h2>
          <div className="form-group">
            <label htmlFor="newUserName">Full Name *</label>
            <input id="newUserName" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sarah Miller" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="newUserPin">4-Digit PIN *</label>
              <input id="newUserPin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="****" maxLength={4} required />
            </div>
            <div className="form-group">
              <label htmlFor="confirmUserPin">Confirm PIN *</label>
              <input id="confirmUserPin" type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder="****" maxLength={4} required />
            </div>
          </div>
          <div className="form-buttons">
            <button type="submit" className="submit-btn">Create User</button>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
