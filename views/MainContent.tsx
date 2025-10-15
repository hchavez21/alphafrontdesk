import React from 'react';
import { Filter, LogEntry, SortOrder, Status } from '../types';
import { formatFollowUpTime, formatTimeAgo, isSameDay } from '../utils/date';

interface HeaderProps {
  currentDate: Date;
  onDateChange: (direction: 'prev' | 'next' | 'today') => void;
  activeFilter: Filter;
  onFilterChange: (filter: Filter) => void;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: string;
  onLogout: () => void;
  followUpCount: number;
  onAddNew: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  activeFilter,
  onFilterChange,
  sortOrder,
  onSortChange,
  searchQuery,
  onSearchChange,
  currentUser,
  onLogout,
  followUpCount,
  onAddNew,
}) => {
  const filters: Filter[] = ['All', 'Open', 'In Progress', 'Resolved', 'Handover', 'Follow-Up'];
  return (
    <header className="header">
      <div className="header-top">
        <div className="date-nav">
          <button onClick={() => onDateChange('prev')} aria-label="Previous day">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div className="date-display">
            <span className="current-date">{new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(currentDate)}</span>
            <button onClick={() => onDateChange('today')} className="today-btn">Go to Today</button>
          </div>
          <button onClick={() => onDateChange('next')} aria-label="Next day">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        <div className="header-actions">
          <button className="submit-btn" onClick={onAddNew}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Entry
          </button>
          <div className="user-info">
            <span>Welcome, <strong>{currentUser}</strong></span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </div>
      <div className="header-controls">
        <div className="filters">
          <span className="filter-label">Status:</span>
          {filters.map((f) => (
            <button
              key={f}
              className={`filter-btn ${activeFilter === f ? 'active' : ''} ${f === 'Follow-Up' ? 'follow-up-filter' : ''}`}
              onClick={() => onFilterChange(f)}
            >
              {f}
              {f === 'Follow-Up' && followUpCount > 0 && (
                <span className="notification-badge">{followUpCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="search-wrapper">
          <input
            type="search"
            className="search-input"
            placeholder="Search logs by room, guest, or keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="sorters">
          <label htmlFor="sort-order">Sort by:</label>
          <select id="sort-order" value={sortOrder} onChange={(e) => onSortChange(e.target.value as SortOrder)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
    </header>
  );
};

interface LogItemProps {
  log: LogEntry;
  onSetEditingId: (id: number) => void;
  onUpdateLogStatus: (id: number, status: Status) => void;
  onViewGuestHistory: (guest: { firstName: string; lastName: string }) => void;
}

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

const LogItem: React.FC<LogItemProps> = ({ log, onSetEditingId, onUpdateLogStatus, onViewGuestHistory }) => {
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

export interface MainContentProps {
  logs: LogEntry[];
  activeFilter: Filter;
  onFilterChange: (filter: Filter) => void;
  onSetEditingId: (id: number) => void;
  onUpdateLogStatus: (id: number, status: Status) => void;
  currentDate: Date;
  onDateChange: (direction: 'prev' | 'next' | 'today') => void;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: string;
  onLogout: () => void;
  onViewGuestHistory: (guest: { firstName: string; lastName: string }) => void;
  followUpCount: number;
  onAddNew: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ logs, onSetEditingId, onUpdateLogStatus, onViewGuestHistory, ...headerProps }) => {
  return (
    <main className="main-content">
      <Header {...headerProps} />
      <div className="content-wrapper">
        <h2 className="feed-title">Daily Log</h2>
        <div className="log-feed">
          {logs.length > 0 ? (
            logs.map((log) => (
              <LogItem key={log.id} log={log} onSetEditingId={onSetEditingId} onUpdateLogStatus={onUpdateLogStatus} onViewGuestHistory={onViewGuestHistory} />
            ))
          ) : (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              <h3>No Logs Found</h3>
              <p>Try adjusting your search or filters, or selecting a different date.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default MainContent;
