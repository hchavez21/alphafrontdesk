import React, { useEffect, useState } from 'react';

export interface EditGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: { firstName: string; lastName: string; phoneNumber: string; email: string; notes: string } | null;
  onUpdateGuest: (originalGuest: { firstName: string; lastName: string }, updatedGuest: { firstName: string; lastName: string; phoneNumber: string; email: string; notes: string }) => void;
  onDeleteGuest: (guest: { firstName: string; lastName: string }) => void;
}

export const EditGuestModal: React.FC<EditGuestModalProps> = ({ isOpen, onClose, guest, onUpdateGuest, onDeleteGuest }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (guest) {
      setFirstName(guest.firstName);
      setLastName(guest.lastName);
      setPhoneNumber(guest.phoneNumber);
      setEmail(guest.email);
      setNotes(guest.notes);
    }
  }, [guest]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert('First and Last name are required.');
      return;
    }
    if (guest) {
      onUpdateGuest({ firstName: guest.firstName, lastName: guest.lastName }, { firstName, lastName, phoneNumber, email, notes });
    }
  };

  const handleDelete = () => {
    if (guest) {
      onDeleteGuest({ firstName: guest.firstName, lastName: guest.lastName });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <form className="log-form" onSubmit={handleSubmit}>
          <h2>Edit Guest Information</h2>
          <div className="form-group">
            <label>Guest Name *</label>
            <div className="form-row">
              <input id="editGuestFirstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" required />
              <input id="editGuestLastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="editGuestPhoneNumber">Guest Phone Number</label>
              <input id="editGuestPhoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="(555) 555-5555" />
            </div>
            <div className="form-group">
              <label htmlFor="editGuestEmail">Guest Email</label>
              <input id="editGuestEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guest@example.com" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="editGuestNotes">Special Notes</label>
            <textarea id="editGuestNotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Prefers foam pillows, VIP guest..."></textarea>
          </div>
          <div className="form-buttons">
            <button type="submit" className="submit-btn">Save Changes</button>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
          </div>
          <div className="form-danger-zone">
            <button type="button" className="delete-btn" onClick={handleDelete}>Delete Guest Profile</button>
          </div>
        </form>
      </div>
    </div>
  );
};
