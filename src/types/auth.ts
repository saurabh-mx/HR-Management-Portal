export type UserRole = 'High Command' | 'HR' | 'Command' | 'Officer';
export type Department = 'SASP' | 'LSPD' | 'SAPR' | 'BCSO' | 'ALL';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  department: Department;
}