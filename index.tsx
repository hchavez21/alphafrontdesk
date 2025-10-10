import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

type Category = 'Request' | 'Complaint' | 'Maintenance' | 'Note';
type Status = 'Open' | 'In Progress' | 'Resolved';
type Filter = Status | 'All' | 'Handover';
type SortOrder = 'newest' | 'oldest';

interface LogEntry {
  id: number;
  timestamp: Date;
  roomNumber: string;
  guestFirstName: string;
  guestLastName: string;
  guestPhoneNumber: string;
  category: Category;
  description: string;
  status: Status;
  staff: string;
}

const staffMembers = ['Alice', 'Bob', 'Charlie'];

const initialLogs: LogEntry[] = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    roomNumber: '305',
    guestFirstName: 'John',
    guestLastName: 'Doe',
    guestPhoneNumber: '555-0101',
    category: 'Request',
    description: 'Guest requested extra towels and a bottle of water.',
    status: 'Resolved',
    staff: 'Alice',
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    roomNumber: '512',
    guestFirstName: 'Jane',
    guestLastName: 'Smith',
    guestPhoneNumber: '555-0102',
    category: 'Complaint',
    description: 'Guest reports that the TV remote is not working. Has tried changing batteries.',
    status: 'In Progress',
    staff: 'Alice',
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    roomNumber: '210',
    guestFirstName: 'Peter',
    guestLastName: 'Jones',
    guestPhoneNumber: '555-0103',
    category: 'Maintenance',
    description: 'Leaky faucet reported in the bathroom sink. Maintenance has been notified.',
    status: 'Open',
    staff: 'Bob',
  },
   {
    id: 4,
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
    roomNumber: '101',
    guestFirstName: 'Sam',
    guestLastName: 'Wilson',
    guestPhoneNumber: '555-0104',
    category: 'Note',
    description: 'Early check-in confirmed for tomorrow morning.',
    status: 'Resolved',
    staff: 'Bob',
  },
  {
    id: 5,
    timestamp: new Date(new Date().setDate(new Date().getDate() - 2)),
    roomNumber: '305',
    guestFirstName: 'John',
    guestLastName: 'Doe',
    guestPhoneNumber: '555-0101',
    category: 'Note',
    description: 'Guest is a repeat customer, celebrating an anniversary. Sent a complimentary bottle of wine.',
    status: 'Resolved',
    staff: 'Charlie',
  }
];

const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();


const App: React.FC = () => {
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
          
          return {
            ...log,
            timestamp: new Date(log.timestamp),
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
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingGuest, setViewingGuest] = useState<{ firstName: string; lastName: string; } | null>(null);

  useEffect(() => {
    try {
        localStorage.setItem('frontDeskLogs', JSON.stringify(logs));
    } catch (error) {
        console.error("Could not save logs to localStorage", error);
    }
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
    setIsModalOpen(false); // Close modal
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

  const handleLogin = (user: string) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const dailyLogs = useMemo(() => logs.filter(log => isSameDay(log.timestamp, currentDate)), [logs, currentDate]);

  const stats = useMemo(() => {
    return {
        total: dailyLogs.length,
        open: dailyLogs.filter(l => l.status === 'Open').length,
        inProgress: dailyLogs.filter(l => l.status === 'In Progress').length,
        resolved: dailyLogs.filter(l => l.status === 'Resolved').length,
    };
  }, [dailyLogs]);

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

    if (filter !== 'All') {
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
  
  const editingLog = useMemo(() => logs.find(log => log.id === editingLogId) || null, [logs, editingLogId]);
  
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="container">
      <Sidebar
        onAddNew={handleOpenAddModal}
        currentUser={currentUser}
      />
      <MainContent
        logs={filteredLogs}
        stats={stats}
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
      />
      <LogFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingLog={editingLog}
        onAddLog={addLog}
        onUpdateLog={updateLog}
        currentUser={currentUser}
      />
      <GuestHistoryModal
        isOpen={!!viewingGuest}
        onClose={handleCloseGuestHistory}
        guest={viewingGuest}
        allLogs={logs}
      />
    </div>
  );
};

interface LoginProps {
    onLogin: (user: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [selectedUser, setSelectedUser] = useState(staffMembers[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUser) {
            onLogin(selectedUser);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                     <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                     <h1>Front Desk Log</h1>
                </div>
                <p>Please select your name to begin your shift.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="user-select">Staff Member</label>
                        <select id="user-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                            {staffMembers.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="submit-btn">Login</button>
                </form>
            </div>
        </div>
    );
}

interface LogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingLog: LogEntry | null;
  onAddLog: (newLog: Omit<LogEntry, 'id' | 'timestamp' | 'staff'>) => void;
  onUpdateLog: (id: number, updatedData: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  currentUser: string;
}

const LogFormModal: React.FC<LogFormModalProps> = ({ isOpen, onClose, editingLog, onAddLog, onUpdateLog, currentUser }) => {
    const [roomNumber, setRoomNumber] = useState('');
    const [guestFirstName, setGuestFirstName] = useState('');
    const [guestLastName, setGuestLastName] = useState('');
    const [guestPhoneNumber, setGuestPhoneNumber] = useState('');
    const [category, setCategory] = useState<Category>('Request');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Status>('Open');
    const [staff, setStaff] = useState(currentUser);

    const resetForm = () => {
        setRoomNumber('');
        setGuestFirstName('');
        setGuestLastName('');
        setGuestPhoneNumber('');
        setCategory('Request');
        setDescription('');
        setStatus('Open');
        setStaff(currentUser);
    };

    useEffect(() => {
        if (isOpen) {
            if (editingLog) {
                setRoomNumber(editingLog.roomNumber);
                setGuestFirstName(editingLog.guestFirstName);
                setGuestLastName(editingLog.guestLastName);
                setGuestPhoneNumber(editingLog.guestPhoneNumber);
                setCategory(editingLog.category);
                setDescription(editingLog.description);
                setStatus(editingLog.status);
                setStaff(editingLog.staff);
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
            category,
            description,
            status,
            staff,
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
                    <div className="form-group">
                        <label htmlFor="roomNumber">Room Number *</label>
                        <input id="roomNumber" type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Guest Name</label>
                         <div className="form-row">
                            <input id="guestFirstName" type="text" value={guestFirstName} onChange={e => setGuestFirstName(e.target.value)} placeholder="First Name" />
                            <input id="guestLastName" type="text" value={guestLastName} onChange={e => setGuestLastName(e.target.value)} placeholder="Last Name" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="guestPhoneNumber">Guest Phone Number</label>
                        <input id="guestPhoneNumber" type="tel" value={guestPhoneNumber} onChange={e => setGuestPhoneNumber(e.target.value)} placeholder="(555) 555-5555"/>
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
                    {editingLog && (
                        <div className="form-group">
                            <label htmlFor="staff">Assigned to Staff</label>
                            <select id="staff" value={staff} onChange={e => setStaff(e.target.value)} required>
                                {staffMembers.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {editingLog && (
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
                    )}
                    <div className="form-group">
                        <label htmlFor="description">Description *</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required></textarea>
                    </div>
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
  onAddNew: () => void;
  currentUser: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddNew }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <h1>Front Desk Log</h1>
            </div>
            <p className="sidebar-subtitle">Centralized Operations & Shift Handover</p>
            <div className="sidebar-action">
                <h2 className="action-title">Log a New Interaction</h2>
                <p className="action-description">Add a request, complaint, or note to the daily log for tracking and handover.</p>
                <button className="submit-btn full-width" onClick={onAddNew}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add New Entry
                </button>
            </div>
        </aside>
    );
};

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
}

const Header: React.FC<HeaderProps> = ({ 
    currentDate, onDateChange, activeFilter, onFilterChange, 
    sortOrder, onSortChange, searchQuery, onSearchChange,
    currentUser, onLogout
}) => {
    const filters: Filter[] = ['All', 'Open', 'In Progress', 'Resolved', 'Handover'];
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
                <div className="user-info">
                    <span>Welcome, <strong>{currentUser}</strong></span>
                    <button onClick={onLogout} className="logout-btn">Logout</button>
                </div>
            </div>
            <div className="header-controls">
                <div className="filters">
                    <span className="filter-label">Status:</span>
                    {filters.map(f => (
                        <button key={f}
                            className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                            onClick={() => onFilterChange(f)}>
                            {f}
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

interface StatsProps {
    stats: { total: number; open: number; inProgress: number; resolved: number; }
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="stat-card">
        <div className="stat-icon">{icon}</div>
        <div className="stat-text">
            <h3>{title}</h3>
            <p>{value}</p>
        </div>
    </div>
);

const Stats: React.FC<StatsProps> = ({ stats }) => {
    return (
        <div className="stats-grid">
            <StatCard title="Total Interactions" value={stats.total} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>} />
            <StatCard title="Open Issues" value={stats.open} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>} />
            <StatCard title="In Progress" value={stats.inProgress} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>} />
            <StatCard title="Resolved" value={stats.resolved} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>} />
        </div>
    );
};


interface MainContentProps {
  logs: LogEntry[];
  stats: { total: number; open: number; inProgress: number; resolved: number; };
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
}

const MainContent: React.FC<MainContentProps> = ({ logs, onSetEditingId, onUpdateLogStatus, stats, onViewGuestHistory, ...headerProps }) => {
  return (
    <main className="main-content">
      <Header {...headerProps} />
      <div className="content-wrapper">
        <Stats stats={stats} />
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

const StatusIcon: React.FC<{ status: Status }> = ({ status }) => {
    switch (status) {
        case 'Open': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
        case 'In Progress': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>;
        case 'Resolved': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
        default: return null;
    }
};

const LogItem: React.FC<LogItemProps> = ({ log, onSetEditingId, onUpdateLogStatus, onViewGuestHistory }) => {
    const { id, timestamp, roomNumber, guestFirstName, guestLastName, category, description, status, staff } = log;
    
    const categoryClass = category.toLowerCase().replace(' ', '-');
    const statusClass = status.toLowerCase().replace(' ', '-');
    const hasGuestName = guestFirstName || guestLastName;
    const fullName = `${guestFirstName} ${guestLastName}`.trim();

    return (
        <div className={`log-item ${categoryClass}`}>
            <div className="log-header">
                <div className="log-info">
                    <div className={`category-icon-wrapper ${categoryClass}`}>
                        <CategoryIcon category={category} />
                    </div>
                    <div className="log-title-group">
                        <div className="log-title">
                            <strong>Room {roomNumber}</strong>
                            <span className={`category-badge ${categoryClass}`}>{category}</span>
                        </div>
                        {hasGuestName && <button className="guest-name" onClick={() => onViewGuestHistory({ firstName: guestFirstName, lastName: guestLastName })}>{fullName}</button>}
                    </div>
                </div>
                <div className="log-meta">
                   <span className="staff">by {staff}</span>
                   <span className="log-timestamp">{formatTimeAgo(timestamp)}</span>
                </div>
            </div>
            <div className="log-body">
                <p>{description}</p>
            </div>
            <div className="log-footer">
                <div className="log-actions">
                    {status === 'Open' && (
                        <button className="quick-action-btn progress" onClick={() => onUpdateLogStatus(id, 'In Progress')}>
                            In Progress
                        </button>
                    )}
                    {status !== 'Resolved' && (
                        <button className="quick-action-btn resolved" onClick={() => onUpdateLogStatus(id, 'Resolved')}>
                            Resolve
                        </button>
                    )}
                    <button className="edit-btn" onClick={() => onSetEditingId(id)} aria-label={`Edit log for room ${roomNumber}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                </div>
                <span className={`status-badge ${statusClass}`}>
                    <StatusIcon status={status} />
                    {status}
                </span>
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay guest-history-modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <h2>Log History for <strong>{guest?.firstName} {guest?.lastName}</strong></h2>
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

const root = createRoot(document.getElementById('root')!);
root.render(<App />);