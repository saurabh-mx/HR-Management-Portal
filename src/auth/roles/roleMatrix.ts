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
