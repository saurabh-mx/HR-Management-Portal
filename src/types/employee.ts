import type { UserRole, Department } from './auth';

export interface EmployeeProfile {
  id: string; // Matches Supabase auth UUID
  employeeId: string;
  fullName: string;
  badgeNumber: string;
  rank: string;
  department: Department;
  role: UserRole;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
  joinDate: string; // YYYY-MM-DD
  avatarUrl?: string;
}

export interface RankChangeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  badgeNumber: string;
  department: Department;
  previousRank: string;
  newRank: string;
  type: 'PROMOTION' | 'DEMOTION';
  date: string; // YYYY-MM-DD
  issuedBy: string;
  reason: string;
}