import React from 'react';
import { Filter, SortOrder } from '../index'; // Import types

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

export const Header: React.FC<HeaderProps> = ({
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
};

interface SimpleHeaderProps {
    title: string;
    currentUser: string;
    onLogout: () => void;
}

export const SimpleHeader: React.FC<SimpleHeaderProps> = ({ title, currentUser, onLogout }) => (
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