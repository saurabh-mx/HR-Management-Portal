import { useAuth } from './useAuth';
import { isTrueAdmin, isHighCommandOrHR, isCommandOrHigher, canToggleAdminSafeMode } from '../roles/roleMatrix';

export function usePermissions() {
  const { profile } = useAuth();
  
  return {
    isTrueAdmin: isTrueAdmin(profile),
    isHighCommandOrHR: isHighCommandOrHR(profile),
    isCommandOrHigher: isCommandOrHigher(profile),
    canToggleAdminSafeMode: canToggleAdminSafeMode(profile)
  };
}
