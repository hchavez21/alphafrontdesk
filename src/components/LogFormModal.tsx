import React, { useState, useEffect } from 'react';
import { LogEntry, Category, Status, Priority } from '../index'; // Import types

const toDateTimeLocalString = (date: Date): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface LogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingLog: LogEntry | null;
  onAddLog: (newLog: Omit<LogEntry, 'id' | 'timestamp' | 'staff'>) => void;
  onUpdateLog: (id: number, updatedData: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  currentUser: string;
  staffMembers: string[];
}

export const LogFormModal: React.FC<LogFormModalProps> = ({ isOpen, onClose, editingLog, onAddLog, onUpdateLog, currentUser, staffMembers }) => {
    const [roomNumber, setRoomNumber] = useState('');
    const [guestFirstName, setGuestFirstName] = useState('');
    const [guestLastName, setGuestLastName] = useState('');
    const [guestPhoneNumber, setGuestPhoneNumber] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestNotes, setGuestNotes] = useState('');
    const [category, setCategory] = useState<Category>('Request');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Status>('Open');
    const [staff, setStaff] = useState(currentUser);
    const [managerFollowUp, setManagerFollowUp] = useState(false);
    const [priority, setPriority] = useState<Priority>('Medium');
    const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
    const [followUpDate, setFollowUpDate] = useState('');


    const resetForm = () => {
        setRoomNumber('');
        setGuestFirstName('');
        setGuestLastName('');
        setGuestPhoneNumber('');
        setGuestEmail('');
        setGuestNotes('');
        setCategory('Request');
        setDescription('');
        setStatus('Open');
        setStaff(currentUser);
        setManagerFollowUp(false);
        setPriority('Medium');
        setScheduleFollowUp(false);
        setFollowUpDate('');
    };

    useEffect(() => {
        if (isOpen) {
            if (editingLog) {
                setRoomNumber(editingLog.roomNumber);
                setGuestFirstName(editingLog.guestFirstName);
                setGuestLastName(editingLog.guestLastName);
                setGuestPhoneNumber(editingLog.guestPhoneNumber);
                setGuestEmail(editingLog.guestEmail || '');
                setGuestNotes(editingLog.guestNotes || '');
                setCategory(editingLog.category);
                setDescription(editingLog.description);
                setStatus(editingLog.status);
                setStaff(editingLog.staff);
                setManagerFollowUp(editingLog.managerFollowUp);
                setPriority(editingLog.priority);
                if (editingLog.followUpDate) {
                  setScheduleFollowUp(true);
                  setFollowUpDate(toDateTimeLocalString(new Date(editingLog.followUpDate)));
                } else {
                  setScheduleFollowUp(false);
                  setFollowUpDate('');
                }
            } else {
                resetForm();
            }
        }
    }, [editingLog, isOpen, currentUser]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !roomNumber.trim()) {
            alert('Room number and description are required.');
            return;
        }

        const logData = {
            roomNumber,
            guestFirstName,
            guestLastName,
            guestPhoneNumber,
            guestEmail,
            guestNotes,
            category,
            description,
            status,
            staff,
            managerFollowUp,
            priority,
            followUpDate: scheduleFollowUp && followUpDate ? new Date(followUpDate) : null,
        };

        if (editingLog) {
            onUpdateLog(editingLog.id, logData);
        } else {
            onAddLog({ ...logData, status: 'Open' });
            resetForm();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <form className="log-form" onSubmit={handleSubmit}>
                    <h2>{editingLog ? 'Edit Log Entry' : 'Create New Log Entry'}</h2>

                    {/* Core Info */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="roomNumber">Room Number *</label>
                            <input id="roomNumber" type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required />
                        </div>
                         <div className="form-group">
                            <label htmlFor="priority">Priority *</label>
                            <select id="priority" value={priority} onChange={e => setPriority(e.target.value as Priority)} required>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>
                     <div className="form-group">
                        <label htmlFor="category">Category *</label>
                        <select id="category" value={category} onChange={e => setCategory(e.target.value as Category)} required>
                            <option value="Request">Request</option>
                            <option value="Complaint">Complaint</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Note">Note</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description *</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Provide a clear and concise description of the event..."></textarea>
                    </div>

                    {/* Guest Info */}
                    <fieldset className="guest-info-group">
                        <legend>Guest Information (Optional)</legend>
                        <div className="form-group">
                            <label>Guest Name</label>
                             <div className="form-row">
                                <input id="guestFirstName" type="text" value={guestFirstName} onChange={e => setGuestFirstName(e.target.value)} placeholder="First Name" />
                                <input id="guestLastName" type="text" value={guestLastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="guestPhoneNumber">Guest Phone Number</label>
                                <input id="guestPhoneNumber" type="tel" value={guestPhoneNumber} onChange={e => setGuestPhoneNumber(e.target.value)} placeholder="(555) 555-5555"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="guestEmail">Guest Email</label>
                                <input id="guestEmail" type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="guest@example.com"/>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="guestNotes">Special Notes</label>
                            <textarea id="guestNotes" value={guestNotes} onChange={e => setGuestNotes(e.target.value)} placeholder="e.g., Prefers foam pillows, VIP guest..." rows={2}></textarea>
                        </div>
                    </fieldset>

                    {/* Editing-only fields */}
                    {editingLog && (
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="staff">Assigned to Staff</label>
                                <select id="staff" value={staff} onChange={e => setStaff(e.target.value)} required>
                                    {staffMembers.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="status">Status *</label>
                                <select
                                    id="status"
                                    value={status}
                                    onChange={e => setStatus(e.target.value as Status)}
                                    required
                                    className={`status-select ${status.toLowerCase().replace(' ', '-')}`}
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Follow-up Actions */}
                     <div className="form-group-checkbox">
                        <input
                            type="checkbox"
                            id="managerFollowUp"
                            checked={managerFollowUp}
                            onChange={(e) => setManagerFollowUp(e.target.checked)}
                        />
                        <label htmlFor="managerFollowUp">
                           Manager Follow-Up Required
                           <span>Alerts management to review this log entry.</span>
                        </label>
                    </div>
                     <div className="form-group-checkbox">
                        <input
                            type="checkbox"
                            id="scheduleFollowUp"
                            checked={scheduleFollowUp}
                            onChange={(e) => setScheduleFollowUp(e.target.checked)}
                        />
                        <label htmlFor="scheduleFollowUp">
                           Schedule Follow-Up
                           <span>Set a specific date and time for a reminder.</span>
                        </label>
                    </div>
                    {scheduleFollowUp && (
                         <div className="form-group form-group-indented">
                             <label htmlFor="followUpDate">Follow-Up Date & Time</label>
                             <input
                                 id="followUpDate"
                                 type="datetime-local"
                                 value={followUpDate}
                                 onChange={e => setFollowUpDate(e.target.value)}
                                 required
                             />
                         </div>
                     )}

                    <div className="form-buttons">
                        <button type="submit" className="submit-btn">{editingLog ? 'Update Log' : 'Log It'}</button>
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    )
}