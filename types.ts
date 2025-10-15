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
