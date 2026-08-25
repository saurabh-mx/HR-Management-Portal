export type UserRole = 'admin' | 'High Command' | 'HR' | 'Command' | 'Supervisor' | 'Patrol Officer' | 'Student';
export type Department = 'SASP' | 'LSPD' | 'SAPR' | 'BCSO' | 'ALL' | 'SASP Academy';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  department: Department;
}