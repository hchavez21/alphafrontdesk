import React from 'react';
import { AppView } from '../index'; // Import AppView type

interface SidebarProps {
  onSetView: (view: AppView) => void;
  activeView: AppView;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSetView, activeView }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <h1>Front Desk Log</h1>
            </div>
            <p className="sidebar-subtitle">Centralized Operations & Shift Handover</p>

            <div className="main-nav">
                <button className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => onSetView('dashboard')}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Dashboard
                </button>
                <button className={`nav-btn ${activeView === 'log' ? 'active' : ''}`} onClick={() => onSetView('log')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M3 10h18"></path></svg>
                    Daily Log
                </button>
                <button className={`nav-btn ${activeView === 'guests' ? 'active' : ''}`} onClick={() => onSetView('guests')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    Guest Directory
                </button>
                <button className={`nav-btn ${activeView === 'reports' ? 'active' : ''}`} onClick={() => onSetView('reports')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8a2.3 2.3 0 0 0-3.4 0l-4.6 4.6a2.3 2.3 0 0 0 0 3.4l3.4 3.4a2.3 2.3 0 0 0 3.4 0l4.6-4.6a2.3 2.3 0 0 0 0-3.4Z"></path></svg>
                    Manager Reports
                </button>
            </div>
        </aside>
    );
};