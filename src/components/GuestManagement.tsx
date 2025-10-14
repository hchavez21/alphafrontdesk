import React, { useState, useMemo } from 'react';
import { LogEntry } from '../index'; // Import types
import { SimpleHeader } from './Header'; // Import SimpleHeader

interface GuestManagementProps {
    allLogs: LogEntry[];
    onViewGuestHistory: (guest: { firstName: string, lastName: string }) => void;
    currentUser: string;
    onLogout: () => void;
    onAddNewGuest: () => void;
    onEditGuest: (guest: { firstName: string; lastName: string; phoneNumber: string; email: string; notes: string; }) => void;
}
export const GuestManagement: React.FC<GuestManagementProps> = ({ allLogs, onViewGuestHistory, currentUser, onLogout, onAddNewGuest, onEditGuest }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const uniqueGuests = useMemo(() => {
        const guestMap = new Map<string, {
            guest: { firstName: string, lastName: string, phoneNumber: string, email: string, notes: string },
            logCount: number
        }>();

        // First, establish the latest data for each guest by using a sorted log list.
        const sortedLogs = [...allLogs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const latestGuestData = new Map<string, LogEntry>();
        for (const log of sortedLogs) {
            const fullName = `${log.guestFirstName} ${log.guestLastName}`.trim();
            if (!fullName) continue;
            const key = fullName.toLowerCase();
            if (!latestGuestData.has(key)) {
                latestGuestData.set(key, log);
            }
        }

        // Now, count all logs for each guest.
        const guestCount = new Map<string, number>();
        for (const log of allLogs) {
            const fullName = `${log.guestFirstName} ${log.guestLastName}`.trim();
            if (!fullName) continue;
            const key = fullName.toLowerCase();
            guestCount.set(key, (guestCount.get(key) || 0) + 1);
        }

        // Combine the latest data with the total count.
        latestGuestData.forEach((log, key) => {
             guestMap.set(key, {
                guest: {
                    firstName: log.guestFirstName,
                    lastName: log.guestLastName,
                    phoneNumber: log.guestPhoneNumber || '',
                    email: log.guestEmail || '',
                    notes: log.guestNotes || ''
                },
                logCount: guestCount.get(key) || 0,
            });
        });

        return Array.from(guestMap.entries())
            .map(([guestId, value]) => ({ ...value, guestId }))
            .sort((a,b) => `${a.guest.lastName} ${a.guest.firstName}`.localeCompare(`${b.guest.lastName} ${b.guest.firstName}`));
    }, [allLogs]);

    const filteredGuests = useMemo(() => {
        if (!searchQuery.trim()) return uniqueGuests;
        const lowercasedQuery = searchQuery.toLowerCase();
        return uniqueGuests.filter(item =>
            `${item.guest.firstName} ${item.guest.lastName}`.toLowerCase().includes(lowercasedQuery) ||
            item.guest.phoneNumber.includes(lowercasedQuery) ||
            item.guest.email.toLowerCase().includes(lowercasedQuery)
        );
    }, [uniqueGuests, searchQuery]);

    return (
        <main className="main-content">
            <SimpleHeader title="Guest Directory" currentUser={currentUser} onLogout={onLogout} />
            <div className="content-wrapper">
                <div className="view-controls">
                     <div className="search-wrapper">
                        <input
                            type="search"
                            className="search-input"
                            placeholder="Search by guest name, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="submit-btn add-guest-btn" onClick={onAddNewGuest}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line></svg>
                        Add New Guest
                    </button>
                </div>
                <div className="guest-list">
                    <div className="guest-list-header">
                        <span>Guest Name</span>
                        <span>Phone Number</span>
                        <span>Log Count</span>
                        <span>Actions</span>
                    </div>
                    {filteredGuests.map(({ guest, logCount, guestId }) => (
                        <div key={guestId} className="guest-item">
                            <button className="guest-item-name-btn" onClick={() => onViewGuestHistory(guest)}>
                                {guest.firstName} {guest.lastName}
                            </button>
                            <span>{guest.phoneNumber || 'N/A'}</span>
                            <span className="guest-item-count">{logCount}</span>
                            <div className="guest-item-actions">
                                <button className="edit-btn" onClick={() => onEditGuest(guest)} aria-label={`Edit guest ${guest.firstName} ${guest.lastName}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredGuests.length === 0 && (
                     <div className="empty-state">
                        <h3>No Guests Found</h3>
                        <p>No guests match your current search query.</p>
                    </div>
                )}
            </div>
        </main>
    );
};