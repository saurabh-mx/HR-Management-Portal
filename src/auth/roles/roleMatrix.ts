import type { Employee } from '@/types';

/**
 * Validates if the user has True Admin privileges.
 */
export function isTrueAdmin(user: Partial<Employee> | null | undefined): boolean {
  if (!user) return false;
  return !!user.is_admin;
}

/**
 * Validates if the user is High Command, HR, or an Admin.
 */
export function isHighCommandOrHR(user: Partial<Employee> | null | undefined): boolean {
  if (!user) return false;
  if (user.is_admin) return true;
  const role = (user.role || '').toLowerCase();
  return ['high command', 'hr'].includes(role);
}

/**
 * Validates if the user is Command, High Command, or an Admin.
 */
export function isCommandOrHigher(user: Partial<Employee> | null | undefined): boolean {
  if (!user) return false;
  if (user.is_admin) return true;
  const role = (user.role || '').toLowerCase();
  return ['admin', 'high command', 'command', 'hr'].includes(role);
}

/**
 * Validates if the user can toggle admin safe mode (Admin role only).
 */
export function canToggleAdminSafeMode(user: Partial<Employee> | null | undefined): boolean {
  if (!user) return false;
  if (user.is_admin) return true;
  const role = (user.role || '').toLowerCase();
  return ['admin'].includes(role);
}

/**
 * Validates if the user can review SOI applications for a specific sub-department.
 * They must be High Command, HR, OR their department/role must indicate leadership for that sub-department.
 */
export function canReviewSOI(user: Partial<Employee> | null | undefined, targetSubDepartment: string): boolean {
  if (!user) return false;
  if (isHighCommandOrHR(user)) return true;

  // Check if they are explicitly assigned to lead this sub-department
  if (user.led_sub_departments && Array.isArray(user.led_sub_departments)) {
    if (user.led_sub_departments.some(d => d.toLowerCase() === targetSubDepartment.toLowerCase())) {
      return true;
    }
  }

  // Fallback to text-parsing for legacy or unconfigured users
  const userDept = (user.department || '').toLowerCase();
  const userRole = (user.role || '').toLowerCase();
  const userRank = (user.rank || '').toLowerCase();
  
  const isTargetDept = userDept.includes(targetSubDepartment.toLowerCase()) || userRank.includes(targetSubDepartment.toLowerCase());
  const isLeader = ['instructor', 'supervisor', 'lead', 'command', 'head'].some(keyword => 
    userRole.includes(keyword) || userRank.includes(keyword) || userDept.includes(keyword)
  );

  return isTargetDept && isLeader;
}
