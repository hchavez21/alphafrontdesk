import React from 'react';
import { LogEntry, Filter, SortOrder } from '../index'; // Import types
import { Header } from './Header'; // Import Header
import { LogItem } from './LogItem'; // Import LogItem

interface MainContentProps {
  logs: LogEntry[];
  activeFilter: Filter;
  onFilterChange: (filter: Filter) => void;
  onSetEditingId: (id: number) => void;
  onUpdateLogStatus: (id: number, status: LogEntry['status']) => void;
  currentDate: Date;
  onDateChange: (direction: 'prev' | 'next' | 'today') => void;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: string;
  onLogout: () => void;
  onViewGuestHistory: (guest: { firstName: string, lastName: string }) => void;
  followUpCount: number;
  onAddNew: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({ logs, onSetEditingId, onUpdateLogStatus, onViewGuestHistory, ...headerProps }) => {
  return (
    <main className="main-content">
      <Header {...headerProps} />
      <div className="content-wrapper">
        <h2 className="feed-title">Daily Log</h2>
        <div className="log-feed">
            {logs.length > 0 ? (
            logs.map(log => <LogItem key={log.id} log={log} onSetEditingId={onSetEditingId} onUpdateLogStatus={onUpdateLogStatus} onViewGuestHistory={onViewGuestHistory}/>)
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