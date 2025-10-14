import React, { useState, useMemo, useEffect } from 'react';
import { LogEntry, Category, Status, Filter, SortOrder, Priority, AppView, User } from '../index'; // Import types from index.tsx
import { Sidebar } from './Sidebar'; // Assuming Sidebar is in components
import { Header } from './Header'; // Assuming Header is in components
import { MainContent } from './MainContent'; // Assuming MainContent is in components
import { Dashboard } from './Dashboard'; // Assuming Dashboard is in components
import { GuestManagement } from './GuestManagement'; // Assuming GuestManagement is in components
import { Reporting } from './Reporting'; // Assuming Reporting is in components
import { LogFormModal } from './LogFormModal'; // Assuming LogFormModal is in components
import { GuestHistoryModal } from './GuestHistoryModal'; // Assuming GuestHistoryModal is in components
import { AddGuestModal } from './AddGuestModal'; // Assuming AddGuestModal is in components
import { EditGuestModal } from './EditGuestModal'; // Assuming EditGuestModal is in components

// Helper function from index.tsx
const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

interface AuthenticatedAppContentProps {
    currentUser: string;
    onLogout: () => void;
    users: User[];
    allLogs: LogEntry[];
    setAllLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
}

export const AuthenticatedAppContent: React.FC<AuthenticatedAppContentProps> = ({
    currentUser,
    onLogout,
    users,
    allLogs,
    setAllLogs,
}) => {
    const [filter, setFilter] = useState<Filter>('All');
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [editingLogId, setEditingLogId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingGuest, setViewingGuest] = useState<{ firstName: string; lastName: string; } | null>(null);
    const [view, setView] = useState<AppView>('dashboard');
    const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
    const [editingGuest, setEditingGuest] = useState<{ firstName: string; lastName: string; phoneNumber: string; email: string; notes: string; } | null>(null);

    const followUpCount = useMemo(() => {
        return allLogs.filter(log => log.managerFollowUp && log.status !== 'Resolved').length;
    }, [allLogs]);

    const addLog = (newLog: Omit<LogEntry, 'id' | 'timestamp' | 'staff'>) => {
        const logEntry: LogEntry = {
            ...newLog,
            id: Date.now(),
            timestamp: new Date(),
            staff: currentUser,
        };
        setAllLogs(prevLogs => [logEntry, ...prevLogs]);
        setCurrentDate(new Date()); // Jump back to today on new log
        setView('log'); // Switch to log view on new entry
        setIsModalOpen(false); // Close modal
    };

    const handleAddGuest = (guest: { firstName: string; lastName: string; phoneNumber: string; email: string; notes: string; }) => {
        const newLogEntry: LogEntry = {
            id: Date.now(),
            timestamp: new Date(),
            roomNumber: 'Directory',
            guestFirstName: guest.firstName,
            guestLastName: guest.lastName,
            guestPhoneNumber: guest.phoneNumber,
            guestEmail: guest.email,
            guestNotes: guest.notes,
            category: 'Note',
            description: 'Guest profile created manually in the directory.',
            status: 'Resolved',
            staff: currentUser,
            managerFollowUp: false,
            priority: 'Low',
            followUpDate: null
        };

        setAllLogs(prevLogs => [newLogEntry, ...prevLogs]);
        setIsAddGuestModalOpen(false);
    };

    const updateLog = (id: number, updatedData: Omit<LogEntry, 'id' | 'timestamp'>) => {
        setAllLogs(prevLogs =>
            prevLogs.map(log =>
                log.id === id ? { ...log, ...updatedData } : log
            )
        );
        setEditingLogId(null);
        setIsModalOpen(false);
    };

    const updateLogStatus = (id: number, status: Status) => {
        setAllLogs(prevLogs =>
            prevLogs.map(log =>
                log.id === id ? { ...log, status: status } : log
            )
        );
    };

    const handleOpenAddModal = () => {
        setEditingLogId(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (id: number) => {
        setEditingLogId(id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingLogId(null);
        setIsModalOpen(false);
    };

    const handleViewGuestHistory = (guest: { firstName: string, lastName: string }) => {
        if (guest && (guest.firstName || guest.lastName)) {
            setViewingGuest(guest);
        }
    };

    const handleCloseGuestHistory = () => {
        setViewingGuest(null);
    };

    const handleOpenEditGuestModal = (guest: { firstName: string; lastName: string; phoneNumber: string; email: string; notes: string; }) => {
        setEditingGuest(guest);
    };

    const handleCloseEditGuestModal = () => {
        setEditingGuest(null);
    };

    const handleUpdateGuest = (originalGuest: { firstName: string; lastName: string; }, updatedGuest: { firstName: string; lastName: string; phoneNumber: string; email: string; notes: string; }) => {
        setAllLogs(prevLogs =>
            prevLogs.map(log => {
                if (log.guestFirstName === originalGuest.firstName && log.guestLastName === originalGuest.lastName) {
                    return {
                        ...log,
                        guestFirstName: updatedGuest.firstName,
                        guestLastName: updatedGuest.lastName,
                        guestPhoneNumber: updatedGuest.phoneNumber,
                        guestEmail: updatedGuest.email,
                        guestNotes: updatedGuest.notes,
                    };
                }
                return log;
            })
        );
        handleCloseEditGuestModal();
    };

    const handleDeleteGuest = (guestToDelete: { firstName: string; lastName: string; }) => {
        if (window.confirm(`Are you sure you want to delete ${guestToDelete.firstName} ${guestToDelete.lastName} and all their associated logs? This action cannot be undone.`)) {
            setAllLogs(prevLogs =>
                prevLogs.filter(log =>
                    !(log.guestFirstName === guestToDelete.firstName && log.guestLastName === guestToDelete.lastName)
                )
            );
            handleCloseEditGuestModal();
        }
    };

    const handleDateChange = (direction: 'prev' | 'next' | 'today') => {
        setCurrentDate(prevDate => {
            if (direction === 'today') {
                return new Date();
            }
            const newDate = new Date(prevDate);
            const modifier = direction === 'prev' ? -1 : 1;
            newDate.setDate(newDate.getDate() + modifier);
            return newDate;
        });
    };

    const dailyLogs = useMemo(() => allLogs.filter(log => isSameDay(log.timestamp, currentDate)), [allLogs, currentDate]);

    const filteredLogs = useMemo(() => {
        let logsToDisplay = [...dailyLogs];

        if (searchQuery.trim() !== '') {
            const lowercasedQuery = searchQuery.toLowerCase();
            logsToDisplay = logsToDisplay.filter(log =>
                log.roomNumber.toLowerCase().includes(lowercasedQuery) ||
                `${log.guestFirstName} ${log.guestLastName}`.toLowerCase().includes(lowercasedQuery) ||
                log.description.toLowerCase().includes(lowercasedQuery) ||
                log.staff.toLowerCase().includes(lowercasedQuery)
            );
        }

        if (filter === 'Follow-Up') {
            logsToDisplay = logsToDisplay.filter(log => log.managerFollowUp);
        } else if (filter !== 'All') {
            if (filter === 'Handover') {
                logsToDisplay = logsToDisplay.filter(log => log.status === 'Open' || log.status === 'In Progress');
            } else {
                logsToDisplay = logsToDisplay.filter(log => log.status === filter);
            }
        }

        logsToDisplay.sort((a, b) => {
            if (sortOrder === 'newest') {
                return b.timestamp.getTime() - a.timestamp.getTime();
            }
            return a.timestamp.getTime() - b.timestamp.getTime();
        });

        return logsToDisplay;
    }, [dailyLogs, filter, sortOrder, searchQuery]);

    const editingLog = useMemo(() => allLogs.find(log => log.id === editingLogId) || null, [allLogs, editingLogId]);

    const staffNames = useMemo(() => users.map(u => u.name), [users]);

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard
                    allLogs={allLogs}
                    onSetEditingId={handleOpenEditModal}
                    onUpdateLogStatus={updateLogStatus}
                    onViewGuestHistory={handleViewGuestHistory}
                    currentUser={currentUser}
                    onLogout={onLogout}
                    onAddNew={handleOpenAddModal}
                />;
            case 'guests':
                return <GuestManagement allLogs={allLogs} onViewGuestHistory={handleViewGuestHistory} currentUser={currentUser} onLogout={onLogout} onAddNewGuest={() => setIsAddGuestModalOpen(true)} onEditGuest={handleOpenEditGuestModal} />;
            case 'reports':
                return <Reporting allLogs={allLogs} currentUser={currentUser} onLogout={onLogout} />;
            case 'log':
            default:
                return <MainContent
                    logs={filteredLogs}
                    activeFilter={filter}
                    onFilterChange={setFilter}
                    onSetEditingId={handleOpenEditModal}
                    onUpdateLogStatus={updateLogStatus}
                    currentDate={currentDate}
                    onDateChange={handleDateChange}
                    sortOrder={sortOrder}
                    onSortChange={setSortOrder}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    currentUser={currentUser}
                    onLogout={onLogout}
                    onViewGuestHistory={handleViewGuestHistory}
                    followUpCount={followUpCount}
                    onAddNew={handleOpenAddModal}
                />;
        }
    }

    return (
        <>
            <Sidebar
                onSetView={setView}
                activeView={view}
            />
            {renderView()}
            <LogFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                editingLog={editingLog}
                onAddLog={addLog}
                onUpdateLog={updateLog}
                currentUser={currentUser}
                staffMembers={staffNames}
            />
            <GuestHistoryModal
                isOpen={!!viewingGuest}
                onClose={handleCloseGuestHistory}
                guest={viewingGuest}
                allLogs={allLogs}
            />
            <AddGuestModal
                isOpen={isAddGuestModalOpen}
                onClose={() => setIsAddGuestModalOpen(false)}
                onAddGuest={handleAddGuest}
            />
            <EditGuestModal
                isOpen={!!editingGuest}
                onClose={handleCloseEditGuestModal}
                guest={editingGuest}
                onUpdateGuest={handleUpdateGuest}
                onDeleteGuest={handleDeleteGuest}
            />
        </>
    );
};