/**
 * Auth Library Barrel Export
 */

// Constants & config
export {
  ACCOUNT_STATES,
  AUTH_ACTIONS,
  AUTH_ERRORS,
  TOKEN_CONFIG,
  LOCKOUT_POLICY,
  PASSWORD_POLICY,
  MFA_CONFIG,
  USERNAME_PATTERN,
  APPROVAL_TYPES,
  ROLE_SCOPES,
  getScopesForRole,
} from './constants';

export type { AccountState, AuthAction, AuthErrorCode } from './constants';

// Types
export type {
  AuthCredential,
  ApprovalRequest,
  AuthToken,
  AuthAuditLog,
  FailedLoginAttempt,
  LoginRequest,
  LoginResponse,
  PasswordChangeRequest,
  PasswordChangeResponse,
  OfficerProfile,
  ApprovalAction,
  ApprovalActionResponse,
  AuthErrorResponse,
  AccessTokenClaims,
  OfficerAuthState,
} from './types';

// Services
export {
  authenticateOfficer,
  changeOfficerPassword,
  getPendingApprovals,
  getApprovalHistory,
  approveOfficerRequest,
  rejectOfficerRequest,
  createOfficerCredentials,
  unlockOfficerAccount,
  revokeOfficerAccess,
  getOfficerAuthState,
  AuthError,
} from './authService';

// Password utilities
export {
  validatePassword,
  validatePasswordDifference,
  generateInitialPassword,
  getPasswordStrengthDisplay,
} from './passwordService';
export type { PasswordValidationResult } from './passwordService';
