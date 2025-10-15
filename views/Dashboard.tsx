import React, { useMemo } from 'react';
import { LogEntry, Priority, Status } from '../types';
import MainContent from './MainContent';

// Reuse LogItem from MainContent by importing default renders through composition if needed.

interface DashboardProps {
  allLogs: LogEntry[];
  onSetEditingId: (id: number) => void;
  onUpdateLogStatus: (id: number, status: Status) => void;
  onViewGuestHistory: (guest: { firstName: string; lastName: string }) => void;
  currentUser: string;
  onLogout: () => void;
  onAddNew: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ allLogs, onSetEditingId, onUpdateLogStatus, onViewGuestHistory, currentUser, onLogout, onAddNew }) => {
  const actionRequiredLogs = useMemo(() =>
    allLogs
      .filter((log) => log.status === 'Open' || log.status === 'In Progress')
      .sort((a, b) => {
        if (a.priority === 'High' && b.priority !== 'High') return -1;
        if (a.priority !== 'High' && b.priority === 'High') return 1;
        if (a.priority === 'Medium' && b.priority === 'Low') return -1;
        if (a.priority === 'Low' && b.priority === 'Medium') return 1;
        return a.timestamp.getTime() - b.timestamp.getTime();
      }),
    [allLogs],
  );

  const managerReviewLogs = useMemo(
    () => allLogs.filter((log) => log.managerFollowUp && log.status !== 'Resolved').sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [allLogs],
  );

  const followUpLogs = useMemo(() => {
    return allLogs
      .filter((log) => log.followUpDate && log.status !== 'Resolved')
      .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime());
  }, [allLogs]);

  return (
    <main className="main-content">
      <header className="header simple-header">
        <div className="header-top">
          <h2>Dashboard</h2>
          <div className="header-actions">
            <button className="submit-btn" onClick={onAddNew}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add New Entry
            </button>
            <div className="user-info">
              <span>
                Welcome, <strong>{currentUser}</strong>
              </span>
              <button onClick={onLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="content-wrapper dashboard-grid">
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Action Required ({actionRequiredLogs.length})
          </h2>
          <div className="log-feed">
            {actionRequiredLogs.length > 0 ? actionRequiredLogs.map((log) => (
              <MainContent key={log.id} logs={[log]} onSetEditingId={onSetEditingId} onUpdateLogStatus={onUpdateLogStatus} onViewGuestHistory={onViewGuestHistory} activeFilter={'All'} onFilterChange={() => {}} currentDate={new Date()} onDateChange={() => {}} sortOrder={'newest'} onSortChange={() => {}} searchQuery={''} onSearchChange={() => {}} currentUser={currentUser} onLogout={onLogout} followUpCount={0} onAddNew={onAddNew} />
            )) : <div className="empty-state-small"><p>All clear! No open items require action.</p></div>}
          </div>
        </section>
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            Manager Review ({managerReviewLogs.length})
          </h2>
          <div className="log-feed">
            {managerReviewLogs.length > 0 ? managerReviewLogs.map((log) => (
              <MainContent key={log.id} logs={[log]} onSetEditingId={onSetEditingId} onUpdateLogStatus={onUpdateLogStatus} onViewGuestHistory={onViewGuestHistory} activeFilter={'All'} onFilterChange={() => {}} currentDate={new Date()} onDateChange={() => {}} sortOrder={'newest'} onSortChange={() => {}} searchQuery={''} onSearchChange={() => {}} currentUser={currentUser} onLogout={onLogout} followUpCount={0} onAddNew={onAddNew} />
            )) : <div className="empty-state-small"><p>No items are flagged for manager review.</p></div>}
          </div>
        </section>
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Follow-Ups ({followUpLogs.length})
          </h2>
          <div className="log-feed">
            {followUpLogs.length > 0 ? followUpLogs.map((log) => (
              <MainContent key={log.id} logs={[log]} onSetEditingId={onSetEditingId} onUpdateLogStatus={onUpdateLogStatus} onViewGuestHistory={onViewGuestHistory} activeFilter={'All'} onFilterChange={() => {}} currentDate={new Date()} onDateChange={() => {}} sortOrder={'newest'} onSortChange={() => {}} searchQuery={''} onSearchChange={() => {}} currentUser={currentUser} onLogout={onLogout} followUpCount={0} onAddNew={onAddNew} />
            )) : <div className="empty-state-small"><p>No follow-ups are scheduled.</p></div>}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
