export type UserRole = 'admin' | 'High Command' | 'HR' | 'Command' | 'Patrol Officer' | 'Student';
export type Department = 'SASP' | 'LSPD' | 'SAPR' | 'BCSO' | 'ALL';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  department: Department;
}