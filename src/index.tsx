import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthenticatedAppContent } from './components/AuthenticatedAppContent'; // Import the new component
import { Login } from './components/Login'; // Import Login
import { AddUserModal } from './components/AddUserModal'; // Import AddUserModal
import './index.css';

// Type Definitions (moved here to be accessible by all components)
export type Category = 'Request' | 'Complaint' | 'Maintenance' | 'Note';
export type Status = 'Open' | 'In Progress' | 'Resolved';
export type Filter = Status | 'All' | 'Handover' | 'Follow-Up';
export type SortOrder = 'newest' | 'oldest';
export type Priority = 'Low' | 'Medium' | 'High';
export type AppView = 'dashboard' | 'log' | 'guests' | 'reports';

export interface LogEntry {
  id: number;
  timestamp: Date;
  roomNumber: string;
  guestFirstName: string;
  guestLastName: string;
  guestPhoneNumber: string;
  guestEmail?: string;
  guestNotes?: string;
  category: Category;
  description: string;
  status: Status;
  staff: string;
  managerFollowUp: boolean;
  priority: Priority;
  followUpDate?: Date | null;
}

export interface User {
  name: string;
  pin: string;
}

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

  const [currentUser, setCurrentUser] = useState<string | null>(() => {
     try {
        return localStorage.getItem('rememberedUser');
     } catch {
        return null;
     }
  });
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);


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

  const handleAddUser = (newUser: User) => {
    if (users.some(u => u.name.toLowerCase() === newUser.name.toLowerCase())) {
        alert('A user with this name already exists.');
        return;
    }
    setUsers(prev => [...prev, newUser]);
    setIsAddUserModalOpen(false);
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

  return (
    <div className="container">
      {currentUser ? (
        <AuthenticatedAppContent
          currentUser={currentUser}
          onLogout={handleLogout}
          users={users}
          allLogs={logs}
          setAllLogs={setLogs}
        />
      ) : (
        <Login onLogin={handleLogin} users={users} onAddNewUser={() => setIsAddUserModalOpen(true)} />
      )}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onAddUser={handleAddUser}
      />
    </div>
  );
};

// Login Component (moved here for clarity, but could be in its own file)
interface LoginProps {
    onLogin: (user: string, remember: boolean) => void;
    users: User[];
    onAddNewUser: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, users, onAddNewUser }) => {
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

// AddUserModal Component (moved here for clarity, but could be in its own file)
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (newUser: User) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onAddUser }) => {
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

const root = createRoot(document.getElementById('root')!);
root.render(<App />);