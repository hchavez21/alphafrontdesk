import React, { useMemo } from 'react';
import { LogEntry } from '../index'; // Import types

interface GuestHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: { firstName: string; lastName: string; } | null;
  allLogs: LogEntry[];
}

export const GuestHistoryModal: React.FC<GuestHistoryModalProps> = ({ isOpen, onClose, guest, allLogs }) => {
  const guestLogs = useMemo(() => {
    if (!guest) return [];
    return allLogs
      .filter(log => log.guestFirstName === guest.firstName && log.guestLastName === guest.lastName)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [allLogs, guest]);

  const latestGuestInfo = useMemo(() => {
    if (guestLogs.length === 0) return null;
    return guestLogs[0];
  }, [guestLogs]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay guest-history-modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <h2>Log History for <strong>{guest?.firstName} {guest?.lastName}</strong></h2>

        {latestGuestInfo && (
            <div className="guest-details-header">
                <div className="guest-details-grid">
                    <div className="guest-detail-item">
                        <label>Phone Number</label>
                        <p>{latestGuestInfo.guestPhoneNumber || 'N/A'}</p>
                    </div>
                    <div className="guest-detail-item">
                        <label>Email Address</label>
                        <p>{latestGuestInfo.guestEmail || 'N/A'}</p>
                    </div>
                </div>
                {latestGuestInfo.guestNotes && (
                    <div className="guest-detail-item guest-notes">
                        <label>Special Notes</label>
                        <p>{latestGuestInfo.guestNotes}</p>
                    </div>
                )}
            </div>
        )}

        <div className="guest-history-list-wrapper">
            {guestLogs.length > 0 ? (
            <div className="guest-history-list">
                {guestLogs.map(log => (
                <div key={log.id} className="guest-history-item">
                    <div className="history-item-header">
                        <span><strong>Room {log.roomNumber}</strong></span>
                        <span className={`category-badge ${log.category.toLowerCase()}`}>{log.category}</span>
                        <span className={`status-badge ${log.status.toLowerCase().replace(' ', '-')}`}>{log.status}</span>
                        <span>{log.timestamp.toLocaleString()}</span>
                    </div>
                    <p className="history-item-description">{log.description}</p>
                    <div className="history-item-footer">
                        <span>Logged by {log.staff}</span>
                    </div>
                </div>
                ))}
            </div>
            ) : (
            <p>No history found for this guest.</p>
            )}
        </div>
      </div>
    </div>
  );
};