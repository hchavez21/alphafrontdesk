import React, { useMemo, useState } from 'react';
import { LogEntry, Priority, Status } from '../types';

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
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

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
                    backgroundColor: item.color || BAR_COLORS[index % BAR_COLORS.length],
                  }}
                ></div>
              </div>
              <span className="bar-value">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="report-card-empty">No data for this period.</p>
      )}
    </div>
  );
};

const Reporting: React.FC<ReportingProps> = ({ allLogs, currentUser, onLogout }) => {
  const [dateRange, setDateRange] = useState<ReportDateRange>('30');

  const logsInDateRange = useMemo(() => {
    const days = parseInt(dateRange, 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return allLogs.filter((log) => log.timestamp.getTime() >= cutoffDate.getTime());
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
      .sort((a, b) => b.value - a.value);
  };

  const categoryData = useMemo(() => {
    const data = aggregateData('category');
    const colorMap: Record<LogEntry['category'], string> = { Request: '#8e44ad', Complaint: '#c0392b', Maintenance: '#f39c12', Note: '#7f8c8d' };
    return data.map((d) => ({ ...d, color: colorMap[d.label as LogEntry['category']] }));
  }, [logsInDateRange]);
  const staffData = useMemo(() => aggregateData('staff'), [logsInDateRange]);
  const priorityData = useMemo(() => {
    const data = aggregateData('priority');
    const colorMap: Record<Priority, string> = { Low: '#10B981', Medium: '#f39c12', High: '#D91E2A' };
    return data.map((d) => ({ ...d, color: colorMap[d.label as Priority] }));
  }, [logsInDateRange]);
  const statusData = useMemo(() => {
    const data = aggregateData('status');
    const colorMap: Record<Status, string> = { Open: '#D91E2A', 'In Progress': '#f0ad4e', Resolved: '#10B981' };
    return data.map((d) => ({ ...d, color: colorMap[d.label as Status] }));
  }, [logsInDateRange]);

  return (
    <main className="main-content">
      <header className="header simple-header">
        <div className="header-top">
          <h2>Manager Reports</h2>
          <div className="user-info">
            <span>Welcome, <strong>{currentUser}</strong></span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
      <div className="content-wrapper">
        <div className="view-controls report-controls">
          <div className="filters">
            <span className="filter-label">Date Range:</span>
            {(['7', '30', '90'] as ReportDateRange[]).map((range) => (
              <button key={range} className={`filter-btn ${dateRange === range ? 'active' : ''}`} onClick={() => setDateRange(range)}>
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

export default Reporting;
