import type { Department } from './auth';

export interface CommunicationPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorRank: string;
  datePosted: string; // YYYY-MM-DD HH:MM
  type: 'ANNOUNCEMENT' | 'BULLETIN';
  priority: 'ROUTINE' | 'IMPORTANT' | 'CRITICAL';
  targetDepartment: Department;
}