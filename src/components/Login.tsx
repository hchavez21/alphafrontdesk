import React, { useState, useEffect } from 'react';
import { User } from '../index'; // Import User type

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