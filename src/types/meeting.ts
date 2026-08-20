import type { Department } from './auth';

export interface MeetingRecord {
  id: string;
  title: string;
  description: string;
  datetime: string; // ISO string or YYYY-MM-DD HH:MM
  location: string;
  type: 'BRIEFING' | 'TRAINING' | 'MEETING';
  attendance: 'MANDATORY' | 'OPTIONAL';
  targetDepartment: Department;
  createdBy: string;
}