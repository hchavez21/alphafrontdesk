import React, { useState, useMemo, useEffect, Suspense, useDeferredValue } from 'react';
import { createRoot } from 'react-dom/client';
import { AppView, Category, Filter, LogEntry, Priority, SortOrder, Status, User } from './types';
import { isSameDay, formatTimeAgo, formatFollowUpTime } from './utils/date';
const Sidebar = React.lazy(() => import('./components/Sidebar').then(m => ({ default: m.Sidebar })));

// types imported from './types'

const initialUsers: User[] = [
  { name: 'Alice', pin: '1234' },
  { name: 'Bob', pin: '5678' },
  { name: 'Charlie', pin: '9876' },
  { name: 'Manager Dave', pin: '0000' },
];

const initialLogs: LogEntry[] = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    roomNumber: '305',
    guestFirstName: 'John',
    guestLastName: 'Doe',
    guestPhoneNumber: '555-0101',
    guestEmail: 'john.d@example.com',
    guestNotes: 'Prefers foam pillows.',
    category: 'Request',
    description: 'Guest requested extra towels and a bottle of water.',
    status: 'Resolved',
    staff: 'Alice',
    managerFollowUp: false,
    priority: 'Low',
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    roomNumber: '512',
    guestFirstName: 'Jane',
    guestLastName: 'Smith',
    guestPhoneNumber: '555-0102',
    guestEmail: 'jane.smith@example.com',
    guestNotes: 'VIP Guest. Celebrating anniversary. Prefers a quiet room away from the elevator.',
    category: 'Complaint',
    description: 'Guest reports that the TV remote is not working. Has tried changing batteries.',
    status: 'In Progress',
    staff: 'Alice',
    managerFollowUp: true,
    priority: 'High',
    followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours from now
  },
  {
    id: 3,
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)), // Made this one day old for demo
    roomNumber: '210',
    guestFirstName: 'Peter',
    guestLastName: 'Jones',
    guestPhoneNumber: '555-0103',
    guestEmail: '',
    guestNotes: '',
    category: 'Maintenance',
    description: 'Leaky faucet reported in the bathroom sink. Maintenance has been notified.',
    status: 'Open',
    staff: 'Bob',
    managerFollowUp: false,
    priority: 'Medium',
    followUpDate: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago (due)
  },
   {
    id: 4,
    timestamp: new Date(new Date().setDate(new Date().getDate() - 8)),
    roomNumber: '101',
    guestFirstName: 'Sam',
    guestLastName: 'Wilson',
    guestPhoneNumber: '555-0104',
    category: 'Note',
    description: 'Early check-in confirmed for tomorrow morning.',
    status: 'Resolved',
    staff: 'Bob',
    managerFollowUp: false,
    priority: 'Low',
  },
  {
    id: 5,
    timestamp: new Date(new Date().setDate(new Date().getDate() - 2)),
    roomNumber: '305',
    guestFirstName: 'John',
    guestLastName: 'Doe',
    guestPhoneNumber: '555-0101',
    guestEmail: 'john.d@example.com',
    guestNotes: 'Prefers foam pillows.',
    category: 'Note',
    description: 'Guest is a repeat customer, celebrating an anniversary. Sent a complimentary bottle of wine.',
    status: 'Resolved',
    staff: 'Charlie',
    managerFollowUp: false,
    priority: 'Medium',
  }
];

// date utilities imported from './utils/date'


const App: React.FC = () => {
   const [users, setUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('frontDeskUsers');
      return savedUsers ? JSON.parse(savedUsers) : initialUsers;
    } catch (error) {
      console.error("Could not load users from localStorage", error);
      return initialUsers;
    }
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const savedLogs = localStorage.getItem('frontDeskLogs');
      if (savedLogs) {
        return JSON.parse(savedLogs).map((log: any) => {
          // Migration for old data structure
          if (log.guestName && !log.guestFirstName && !log.guestLastName) {
            const nameParts = log.guestName.split(' ');
            log.guestFirstName = nameParts.shift() || '';
            log.guestLastName = nameParts.join(' ');
          }
          delete log.guestName;

          if (typeof log.guestFirstName === 'undefined') log.guestFirstName = '';
          if (typeof log.guestLastName === 'undefined') log.guestLastName = '';
          if (typeof log.guestPhoneNumber === 'undefined') log.guestPhoneNumber = '';
          if (typeof log.guestEmail === 'undefined') log.guestEmail = '';
          if (typeof log.guestNotes === 'undefined') log.guestNotes = '';
          
          return {
            ...log,
            timestamp: new Date(log.timestamp),
            managerFollowUp: log.managerFollowUp || false,
            priority: log.priority || 'Medium',
            followUpDate: log.followUpDate ? new Date(log.followUpDate) : null,
          };
        });
      }
    } catch (error) {
      console.error("Could not load logs from localStorage", error);
    }
    return initialLogs;
  });

  const [filter, setFilter] = useState<Filter>('All');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
     try {
        return localStorage.getItem('rememberedUser');
     } catch {
        return null;
     }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingGuest, setViewingGuest] = useState<{ firstName: string; lastName: string; } | null>(null);
  const [view, setView] = useState<AppView>('dashboard');
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<{ firstName: string; lastName: string; phoneNumber: string; email: string; notes: string; } | null>(null);


  useEffect(() => {
    try {
        localStorage.setItem('frontDeskLogs', JSON.stringify(logs));
    } catch (error) {
        console.error("Could not save logs to localStorage", error);
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem('frontDeskUsers', JSON.stringify(users));
    } catch (error) {
      console.error("Could not save users to localStorage", error);
    }
  }, [users]);
  
  const followUpCount = useMemo(() => {
    return logs.filter(log => log.managerFollowUp && log.status !== 'Resolved').length;
  }, [logs]);

  const addLog = (newLog: Omit<LogEntry, 'id' | 'timestamp' | 'staff'>) => {
    if (!currentUser) return;
    const logEntry: LogEntry = {
      ...newLog,
      id: Date.now(),
      timestamp: new Date(),
      staff: currentUser,
    };
    setLogs(prevLogs => [logEntry, ...prevLogs]);
    setCurrentDate(new Date()); // Jump back to today on new log
    setView('log'); // Switch to log view on new entry
    setIsModalOpen(false); // Close modal
  };
  
  const handleAddGuest = (guest: { firstName: string; lastName: string; phoneNumber: string; email: string; notes: string; }) => {
    if (!currentUser) return;
    
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
    
    setLogs(prevLogs => [newLogEntry, ...prevLogs]);
    setIsAddGuestModalOpen(false);
  };
  
  const handleAddUser = (newUser: User) => {
    if (users.some(u => u.name.toLowerCase() === newUser.name.toLowerCase())) {
        alert('A user with this name already exists.');
        return;
    }
    setUsers(prev => [...prev, newUser]);
    setIsAddUserModalOpen(false);
  };

  const updateLog = (id: number, updatedData: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs(prevLogs =>
      prevLogs.map(log =>
        log.id === id ? { ...log, ...updatedData } : log
      )
    );
    setEditingLogId(null);
    setIsModalOpen(false);
  };
  
  const updateLogStatus = (id: number, status: Status) => {
    setLogs(prevLogs =>
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

  const handleOpenEditGuestModal = (guest: { firstName: string, lastName: string, phoneNumber: string, email: string, notes: string }) => {
    setEditingGuest(guest);
  };

  const handleCloseEditGuestModal = () => {
    setEditingGuest(null);
  };

  const handleUpdateGuest = (originalGuest: { firstName: string; lastName: string; }, updatedGuest: { firstName: string; lastName: string; phoneNumber: string; email: string; notes: string; }) => {
    setLogs(prevLogs =>
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
        setLogs(prevLogs =>
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

  const handleLogin = (user: string, remember: boolean) => {
    setCurrentUser(user);
    if (remember) {
      localStorage.setItem('rememberedUser', user);
    } else {
      localStorage.removeItem('rememberedUser');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('rememberedUser');
  };

  const dailyLogs = useMemo(() => logs.filter(log => isSameDay(log.timestamp, currentDate)), [logs, currentDate]);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredLogs = useMemo(() => {
    let logsToDisplay = [...dailyLogs];

    if (deferredSearchQuery.trim() !== '') {
        const lowercasedQuery = deferredSearchQuery.toLowerCase();
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
  }, [dailyLogs, filter, sortOrder, deferredSearchQuery]);
  
  const editingLog = useMemo(() => logs.find(log => log.id === editingLogId) || null, [logs, editingLogId]);
  
  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} onAddNewUser={() => setIsAddUserModalOpen(true)} />;
  }
  
  const MainContent = React.lazy(() => import('./views/MainContent'));
  const Dashboard = React.lazy(() => import('./views/Dashboard'));
  const GuestManagement = React.lazy(() => import('./views/GuestManagement'));
  const Reporting = React.lazy(() => import('./views/Reporting'));

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return (
          <Dashboard
            allLogs={logs}
            onSetEditingId={handleOpenEditModal}
            onUpdateLogStatus={updateLogStatus}
            onViewGuestHistory={handleViewGuestHistory}
            currentUser={currentUser}
            onLogout={handleLogout}
            onAddNew={handleOpenAddModal}
          />
        );
      case 'guests':
        return (
          <GuestManagement
            allLogs={logs}
            onViewGuestHistory={handleViewGuestHistory}
            currentUser={currentUser}
            onLogout={handleLogout}
            onAddNewGuest={() => setIsAddGuestModalOpen(true)}
            onEditGuest={handleOpenEditGuestModal}
          />
        );
      case 'reports':
        return <Reporting allLogs={logs} currentUser={currentUser} onLogout={handleLogout} />;
      case 'log':
      default:
        return (
          <MainContent
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
            onLogout={handleLogout}
            onViewGuestHistory={handleViewGuestHistory}
            followUpCount={followUpCount}
            onAddNew={handleOpenAddModal}
          />
        );
    }
  };

  const staffNames = useMemo(() => users.map(u => u.name), [users]);

  return (
    <div className="container">
      <Sidebar onSetView={setView} activeView={view} />
      <Suspense fallback={<div className="content-wrapper"><p>Loading…</p></div>}>
        {renderView()}
      </Suspense>
      {/* Modals (kept eager for UX; can lazy if needed) */}
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
        allLogs={logs}
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
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onAddUser={handleAddUser}
      />
    </div>
  );
};

interface LoginProps {
    onLogin: (user: string, remember: boolean) => void;
    users: User[];
    onAddNewUser: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, onAddNewUser }) => {
    const [selectedUser, setSelectedUser] = useState(users[0]?.name || '');
    const [pin, setPin] = useState('');
    const [remember, setRemember] = useState(true);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = users.find(u => u.name === selectedUser);
        if (user && user.pin === pin) {
            onLogin(selectedUser, remember);
        } else {
            setError('Invalid PIN. Please try again.');
            setPin('');
        }
    };
    
    useEffect(() => {
        // If users list changes (e.g., new user added), update default selection
        if (!users.some(u => u.name === selectedUser) && users.length > 0) {
            setSelectedUser(users[0].name);
        }
    }, [users, selectedUser]);


    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                     <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                     <h1>Front Desk Log</h1>
                </div>
                <p>Please select your name and enter your PIN.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="user-select">Staff Member</label>
                        <select id="user-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                            {users.map(user => (
                                <option key={user.name} value={user.name}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="pin-input">4-Digit PIN</label>
                        <input
                            id="pin-input"
                            type="password"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            maxLength={4}
                            pattern="\d{4}"
                            inputMode="numeric"
                            required
                            placeholder="****"
                        />
                    </div>
                    {error && <p className="login-error">{error}</p>}
                    <div className="login-options">
                       <div className="form-group-checkbox">
                          <input
                              type="checkbox"
                              id="remember-me"
                              checked={remember}
                              onChange={(e) => setRemember(e.target.checked)}
                          />
                          <label htmlFor="remember-me">Remember me</label>
                      </div>
                      <button type="button" className="new-user-btn" onClick={onAddNewUser}>New User?</button>
                    </div>
                    <button type="submit" className="submit-btn">Login</button>
                </form>
            </div>
        </div>
    );
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (newUser: User) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onAddUser }) => {
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
        // Reset form
        setName('');
        setPin('');
        setConfirmPin('');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <form className="log-form" onSubmit={handleSubmit}>
                    <h2>Add New Staff Member</h2>
                    <div className="form-group">
                        <label htmlFor="newUserName">Full Name *</label>
                        <input id="newUserName" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Sarah Miller" required />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="newUserPin">4-Digit PIN *</label>
                            <input id="newUserPin" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="****" maxLength={4} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmUserPin">Confirm PIN *</label>
                            <input id="confirmUserPin" type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} placeholder="****" maxLength={4} required />
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

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGuest: (guest: { firstName: string; lastName: string; phoneNumber: string; email: string; notes: string; }) => void;
}

const AddGuestModal: React.FC<AddGuestModalProps> = ({ isOpen, onClose, onAddGuest }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim()) {
            alert('First and Last name are required.');
            return;
        }
        onAddGuest({ firstName, lastName, phoneNumber, email, notes });
        // Reset form for next time
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setEmail('');
        setNotes('');
    };
    
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <form className="log-form" onSubmit={handleSubmit}>
                    <h2>Add New Guest</h2>
                    <div className="form-group">
                        <label>Guest Name *</label>
                         <div className="form-row">
                            <input id="newGuestFirstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" required />
                            <input id="newGuestLastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" required />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="newGuestPhoneNumber">Guest Phone Number</label>
                            <input id="newGuestPhoneNumber" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="(555) 555-5555"/>
                        </div>
                        <div className="form-group">
                             <label htmlFor="newGuestEmail">Guest Email</label>
                            <input id="newGuestEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="guest@example.com"/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="newGuestNotes">Special Notes</label>
                        <textarea id="newGuestNotes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Prefers foam pillows, VIP guest..."></textarea>
                    </div>
                    <div className="form-buttons">
                        <button type="submit" className="submit-btn">Save Guest</button>
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

interface LogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingLog: LogEntry | null;
  onAddLog: (newLog: Omit<LogEntry, 'id' | 'timestamp' | 'staff'>) => void;
  onUpdateLog: (id: number, updatedData: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  currentUser: string;
  staffMembers: string[];
}

const toDateTimeLocalString = (date: Date): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const LogFormModal: React.FC<LogFormModalProps> = ({ isOpen, onClose, editingLog, onAddLog, onUpdateLog, currentUser, staffMembers }) => {
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
                                <input id="guestLastName" type="text" value={guestLastName} onChange={e => setGuestLastName(e.target.value)} placeholder="Last Name" />
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

interface SidebarProps {
  onSetView: (view: AppView) => void;
  activeView: AppView;
}


// Sidebar extracted to './components/Sidebar'

interface SimpleHeaderProps {
    title: string;
    currentUser: string;
    onLogout: () => void;
}

const SimpleHeader: React.FC<SimpleHeaderProps> = ({ title, currentUser, onLogout }) => (
     <header className="header simple-header">
        <div className="header-top">
            <h2>{title}</h2>
            <div className="user-info">
                <span>Welcome, <strong>{currentUser}</strong></span>
                <button onClick={onLogout} className="logout-btn">Logout</button>
            </div>
        </div>
    </header>
);

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
    currentDate, onDateChange, activeFilter, onFilterChange, 
    sortOrder, onSortChange, searchQuery, onSearchChange,
    currentUser, onLogout, followUpCount, onAddNew
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
                    {filters.map(f => (
                        <button key={f}
                            className={`filter-btn ${activeFilter === f ? 'active' : ''} ${f === 'Follow-Up' ? 'follow-up-filter' : ''}`}
                            onClick={() => onFilterChange(f)}>
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
}

interface MainContentProps {
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
  onViewGuestHistory: (guest: { firstName: string, lastName: string }) => void;
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

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  
  return date.toLocaleDateString();
};

const formatFollowUpTime = (date: Date): string => {
    const now = new Date();
    if (isSameDay(date, now)) {
        return `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    if (isSameDay(date, tomorrow)) {
        return `Tomorrow at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

interface LogItemProps {
    log: LogEntry;
    onSetEditingId: (id: number) => void;
    onUpdateLogStatus: (id: number, status: Status) => void;
    onViewGuestHistory: (guest: { firstName: string, lastName: string }) => void;
}

const CategoryIcon: React.FC<{ category: Category }> = ({ category }) => {
    switch (category) {
        case 'Request': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
        case 'Complaint': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
        case 'Maintenance': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>;
        case 'Note': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M3 10h18"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>;
        default: return null;
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
                    {hasGuestName && <button className="guest-name" onClick={() => onViewGuestHistory({ firstName: guestFirstName, lastName: guestLastName })}>{fullName}</button>}
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
                                    title={`Follow-up scheduled for ${new Date(followUpDate).toLocaleString()}`}>
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

const GuestHistoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  guest: { firstName: string; lastName: string; } | null;
  allLogs: LogEntry[];
}> = ({ isOpen, onClose, guest, allLogs }) => {
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

interface EditGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: { firstName: string; lastName: string; phoneNumber: string; email: string; notes: string; } | null;
  onUpdateGuest: (originalGuest: { firstName: string; lastName: string; }, updatedGuest: { firstName: string; lastName: string; phoneNumber: string; email: string; notes: string; }) => void;
  onDeleteGuest: (guest: { firstName: string; lastName: string; }) => void;
}

const EditGuestModal: React.FC<EditGuestModalProps> = ({ isOpen, onClose, guest, onUpdateGuest, onDeleteGuest }) => {
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
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <form className="log-form" onSubmit={handleSubmit}>
                    <h2>Edit Guest Information</h2>
                    <div className="form-group">
                        <label>Guest Name *</label>
                        <div className="form-row">
                            <input id="editGuestFirstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" required />
                            <input id="editGuestLastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" required />
                        </div>
                    </div>
                     <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="editGuestPhoneNumber">Guest Phone Number</label>
                            <input id="editGuestPhoneNumber" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="(555) 555-5555"/>
                        </div>
                         <div className="form-group">
                            <label htmlFor="editGuestEmail">Guest Email</label>
                            <input id="editGuestEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="guest@example.com"/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="editGuestNotes">Special Notes</label>
                        <textarea id="editGuestNotes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Prefers foam pillows, VIP guest..."></textarea>
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
    )
}

// --- DASHBOARD VIEW ---
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
    const actionRequiredLogs = useMemo(() => allLogs
        .filter(log => log.status === 'Open' || log.status === 'In Progress')
        .sort((a, b) => {
            if (a.priority === 'High' && b.priority !== 'High') return -1;
            if (a.priority !== 'High' && b.priority === 'High') return 1;
            if (a.priority === 'Medium' && b.priority === 'Low') return -1;
            if (a.priority === 'Low' && b.priority === 'Medium') return 1;
            return a.timestamp.getTime() - b.timestamp.getTime(); // Oldest first
        }), [allLogs]);

    const managerReviewLogs = useMemo(() => allLogs
        .filter(log => log.managerFollowUp && log.status !== 'Resolved')
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()), [allLogs]);

    const followUpLogs = useMemo(() => {
        return allLogs
            .filter(log => log.followUpDate && log.status !== 'Resolved')
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
                            <span>Welcome, <strong>{currentUser}</strong></span>
                            <button onClick={onLogout} className="logout-btn">Logout</button>
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
                        {actionRequiredLogs.length > 0 ? (
                            actionRequiredLogs.map(log => <LogItem key={log.id} log={log} onSetEditingId={onSetEditingId} onUpdateLogStatus={onUpdateLogStatus} onViewGuestHistory={onViewGuestHistory}/>)
                        ) : <div className="empty-state-small"><p>All clear! No open items require action.</p></div>}
                    </div>
                </section>
                 <section className="dashboard-section">
                    <h2 className="dashboard-section-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                        Manager Review ({managerReviewLogs.length})
                    </h2>
                     <div className="log-feed">
                        {managerReviewLogs.length > 0 ? (
                            managerReviewLogs.map(log => <LogItem key={log.id} log={log} onSetEditingId={onSetEditingId} onUpdateLogStatus={onUpdateLogStatus} onViewGuestHistory={onViewGuestHistory}/>)
                        ) : <div className="empty-state-small"><p>No items are flagged for manager review.</p></div>}
                    </div>
                </section>
                 <section className="dashboard-section">
                    <h2 className="dashboard-section-title">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Follow-Ups ({followUpLogs.length})
                    </h2>
                     <div className="log-feed">
                        {followUpLogs.length > 0 ? (
                            followUpLogs.map(log => <LogItem key={log.id} log={log} onSetEditingId={onSetEditingId} onUpdateLogStatus={onUpdateLogStatus} onViewGuestHistory={onViewGuestHistory}/>)
                        ) : <div className="empty-state-small"><p>No follow-ups are scheduled.</p></div>}
                    </div>
                </section>
            </div>
        </main>
    );
};


// --- GUEST MANAGEMENT VIEW ---
interface GuestManagementProps {
    allLogs: LogEntry[];
    onViewGuestHistory: (guest: { firstName: string, lastName: string }) => void;
    currentUser: string;
    onLogout: () => void;
    onAddNewGuest: () => void;
    onEditGuest: (guest: { firstName: string; lastName: string; phoneNumber: string; email: string; notes: string; }) => void;
}
const GuestManagement: React.FC<GuestManagementProps> = ({ allLogs, onViewGuestHistory, currentUser, onLogout, onAddNewGuest, onEditGuest }) => {
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

// --- REPORTING VIEW ---
interface ReportingProps {
  allLogs: LogEntry[];
  currentUser: string;
  onLogout: () => void;
}
type ReportDateRange = '7' | '30' | '90';

interface BarChartProps {
    data: { label: string; value: number; color?: string }[];
    title: string;
}

const BAR_COLORS = ['#0A66C2', '#f0ad4e', '#10B981', '#8e44ad', '#c0392b', '#f39c12', '#7f8c8d'];

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
    
    return (
        <div className="report-card">
            <h3>{title}</h3>
            {data.length > 0 ? (
                <div className="bar-chart">
                    {data.map((item, index) => (
                        <div key={item.label} className="bar-item">
                            <span className="bar-label">{item.label}</span>
                            <div className="bar-wrapper">
                                <div 
                                    className="bar"
                                    style={{
                                        width: `${(item.value / maxValue) * 100}%`,
                                        backgroundColor: item.color || BAR_COLORS[index % BAR_COLORS.length]
                                    }}
                                ></div>
                            </div>
                            <span className="bar-value">{item.value}</span>
                        </div>
                    ))}
                </div>
            ) : <p className="report-card-empty">No data for this period.</p>}
        </div>
    );
}

const Reporting: React.FC<ReportingProps> = ({ allLogs, currentUser, onLogout }) => {
    const [dateRange, setDateRange] = useState<ReportDateRange>('30');
    
    const logsInDateRange = useMemo(() => {
        const days = parseInt(dateRange, 10);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return allLogs.filter(log => log.timestamp.getTime() >= cutoffDate.getTime());
    }, [allLogs, dateRange]);
    
    const aggregateData = (key: keyof LogEntry) => {
        const counts = logsInDateRange.reduce((acc, log) => {
            const value = log[key];
            if (value !== null && value !== undefined) {
                const keyString = String(value);
                acc[keyString] = (acc[keyString] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(counts)
            .map(([label, value]: [string, number]) => ({ label, value }))
            .sort((a,b) => b.value - a.value);
    };

    const categoryData = useMemo(() => {
        const data = aggregateData('category');
        const colorMap: Record<Category, string> = { 'Request': '#8e44ad', 'Complaint': '#c0392b', 'Maintenance': '#f39c12', 'Note': '#7f8c8d' };
        return data.map(d => ({ ...d, color: colorMap[d.label as Category] }));
    }, [logsInDateRange]);
    const staffData = useMemo(() => aggregateData('staff'), [logsInDateRange]);
    const priorityData = useMemo(() => {
        const data = aggregateData('priority');
        const colorMap: Record<Priority, string> = { 'Low': '#10B981', 'Medium': '#f39c12', 'High': '#D91E2A' };
        return data.map(d => ({ ...d, color: colorMap[d.label as Priority] }));
    }, [logsInDateRange]);
    const statusData = useMemo(() => {
        const data = aggregateData('status');
        const colorMap: Record<Status, string> = { 'Open': '#D91E2A', 'In Progress': '#f0ad4e', 'Resolved': '#10B981' };
        return data.map(d => ({ ...d, color: colorMap[d.label as Status] }));
    }, [logsInDateRange]);

    return (
        <main className="main-content">
            <SimpleHeader title="Manager Reports" currentUser={currentUser} onLogout={onLogout} />
            <div className="content-wrapper">
                <div className="view-controls report-controls">
                    <div className="filters">
                        <span className="filter-label">Date Range:</span>
                        {(['7', '30', '90'] as ReportDateRange[]).map(range => (
                             <button 
                                key={range}
                                className={`filter-btn ${dateRange === range ? 'active' : ''}`}
                                onClick={() => setDateRange(range)}
                            >
                                Last {range} Days
                            </button>
                        ))}
                    </div>
                     <div className="report-summary">
                        Showing <strong>{logsInDateRange.length}</strong> logs from the last {dateRange} days.
                    </div>
                </div>
                <div className="report-grid">
                    <BarChart title="Logs by Category" data={categoryData} />
                    <BarChart title="Logs by Staff Member" data={staffData} />
                    <BarChart title="Logs by Priority" data={priorityData} />
                    <BarChart title="Logs by Status" data={statusData} />
                </div>
            </div>
        </main>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);