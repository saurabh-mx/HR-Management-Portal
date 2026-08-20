export interface StrikeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  badgeNumber: string;
  issuedBy: string; 
  strikeLevel: 1 | 2 | 3 | 4 | 5;
  reason: string;
  dateIssued: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'APPEALED' | 'EXPUNGED';
  evidenceUrls?: string[];
}