import React from 'react';
import { LogEntry, Status } from '../types';
import { formatFollowUpTime, formatTimeAgo, isSameDay } from '../utils/date';

const CategoryIcon: React.FC<{ category: LogEntry['category'] }> = ({ category }) => {
  switch (category) {
    case 'Request':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
      );
    case 'Complaint':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
      );
    case 'Maintenance':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
      );
    case 'Note':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M3 10h18"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>
      );
    default:
      return null;
  }
};

export interface LogItemProps {
  log: LogEntry;
  onSetEditingId: (id: number) => void;
  onUpdateLogStatus: (id: number, status: Status) => void;
  onViewGuestHistory: (guest: { firstName: string; lastName: string }) => void;
}

export const LogItem: React.FC<LogItemProps> = ({ log, onSetEditingId, onUpdateLogStatus, onViewGuestHistory }) => {
  const { id, timestamp, roomNumber, guestFirstName, guestLastName, category, description, status, staff, managerFollowUp, priority, followUpDate } = log;

  const hasGuestName = guestFirstName || guestLastName;
  const fullName = `${guestFirstName} ${guestLastName}`.trim();
  const isOverdue = status !== 'Resolved' && !isSameDay(timestamp, new Date());

  const now = new Date();
  const isFollowUpOverdue = followUpDate && new Date(followUpDate) < now && status !== 'Resolved';
  const isFollowUpUpcoming = followUpDate && !isFollowUpOverdue && isSameDay(new Date(followUpDate), now) && status !== 'Resolved';

  return (
    <div className={`log-item-card priority-${priority.toLowerCase()}`}>
      <div className="log-card-header">
        <div className="log-card-title">
          <CategoryIcon category={category} />
          <strong>Room {roomNumber}</strong>
          {hasGuestName && (
            <button className="guest-name" onClick={() => onViewGuestHistory({ firstName: guestFirstName, lastName: guestLastName })}>{fullName}</button>
          )}
        </div>
        <div className="log-card-meta">
          <span className="log-timestamp" title={new Date(timestamp).toLocaleString()}>{formatTimeAgo(timestamp)} by {staff}</span>
          <button className="edit-btn" onClick={() => onSetEditingId(id)} aria-label={`Edit log for room ${roomNumber}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
        </div>
      </div>

      <div className="log-card-body">
        <p>{description}</p>
      </div>

      <div className="log-card-footer">
        <div className="log-card-details">
          <div className="log-tags-row">
            <span className={`priority-badge priority-${priority.toLowerCase()}`}>{priority}</span>
            {isOverdue && (
              <span className="overdue-indicator" title="This open item is from a previous day.">
                Overdue
              </span>
            )}
          </div>
          {(managerFollowUp || followUpDate) && (
            <div className="log-tags-row">
              {managerFollowUp && (
                <span className="manager-follow-up-tag" title="Manager Follow-Up Required">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                  Manager Review
                </span>
              )}
              {followUpDate && (
                <span
                  className={`follow-up-indicator ${isFollowUpOverdue ? 'due' : ''} ${isFollowUpUpcoming ? 'upcoming' : ''}`}
                  title={`Follow-up scheduled for ${new Date(followUpDate).toLocaleString()}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {formatFollowUpTime(new Date(followUpDate))}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="status-changer">
          <select
            value={status}
            onChange={(e) => onUpdateLogStatus(id, e.target.value as Status)}
            className={`status-select-tag status-${status.toLowerCase().replace(' ', '-')}`}
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default LogItem;
