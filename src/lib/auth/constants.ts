/**
 * Auth Constants
 * Centralized configuration for the officer auth system.
 */

// ─── Account States ──────────────────────────────────────────────────────
export const ACCOUNT_STATES = {
  PENDING_INITIAL_LOGIN: 'pending_initial_login',
  PENDING_PASSWORD_CHANGE: 'pending_password_change',
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  LOCKED: 'locked',
  REVOKED: 'revoked',
  REJECTED: 'rejected',
} as const;

export type AccountState = typeof ACCOUNT_STATES[keyof typeof ACCOUNT_STATES];

// ─── Token Configuration ─────────────────────────────────────────────────
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_LIFETIME_SECONDS: 900,       // 15 minutes
  REFRESH_TOKEN_LIFETIME_SECONDS: 604800,   // 7 days
  TEMPORARY_TOKEN_LIFETIME_SECONDS: 600,    // 10 minutes
  TOKEN_REFRESH_REUSE_WINDOW_SECONDS: 30,   // Grace window for network retries
} as const;

// ─── Password Policy ──────────────────────────────────────────────────────
export const PASSWORD_POLICY = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_DIGIT: true,
  REQUIRE_SPECIAL: true,
  SPECIAL_CHARS: '!@#$%^&*()-_+=',
  HISTORY_SIZE: 5,
  EXPIRY_DAYS: 90,
  GRACE_PERIOD_DAYS: 14,
  MIN_LEVENSHTEIN_DISTANCE: 4,
} as const;

// ─── Lockout Policy ──────────────────────────────────────────────────────
export const LOCKOUT_POLICY = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
  MAX_LOCKOUTS_PER_DAY: 3,
  PROGRESSIVE_DELAYS_MS: [0, 0, 2000, 5000, 10000], // delays for attempts 1-5
  IP_RATE_LIMIT_ATTEMPTS: 20,
  IP_RATE_LIMIT_WINDOW_MINUTES: 15,
  IP_BLOCK_DURATION_MINUTES: 60,
} as const;

// ─── Username Validation ─────────────────────────────────────────────────
export const USERNAME_PATTERN = /^[a-z0-9]{2,30}\.[a-z0-9]{1,10}(\.[a-z0-9]{2,10})?$/i;

// ─── MFA Configuration ───────────────────────────────────────────────────
export const MFA_CONFIG = {
  GRACE_PERIOD_DAYS: 30,
  TOTP_DIGITS: 6,
  TOTP_PERIOD_SECONDS: 30,
  RECOVERY_CODE_COUNT: 10,
} as const;

// ─── Auth Audit Actions ──────────────────────────────────────────────────
export const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  FIRST_LOGIN: 'FIRST_LOGIN',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_CHANGE_FAILED: 'PASSWORD_CHANGE_FAILED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  ACCOUNT_REVOKED: 'ACCOUNT_REVOKED',
  ACCOUNT_REINSTATED: 'ACCOUNT_REINSTATED',
  APPROVAL_SUBMITTED: 'APPROVAL_SUBMITTED',
  APPROVAL_GRANTED: 'APPROVAL_GRANTED',
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',
  TOKEN_ISSUED: 'TOKEN_ISSUED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  TOKEN_FAMILY_REVOKED: 'TOKEN_FAMILY_REVOKED',
  LOGOUT: 'LOGOUT',
  MFA_ENROLLED: 'MFA_ENROLLED',
  MFA_VERIFIED: 'MFA_VERIFIED',
  MFA_FAILED: 'MFA_FAILED',
} as const;

export type AuthAction = typeof AUTH_ACTIONS[keyof typeof AUTH_ACTIONS];

// ─── Auth Error Codes ─────────────────────────────────────────────────────
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: { code: 'INVALID_CREDENTIALS', status: 401, message: 'Invalid username or password.' },
  TOKEN_EXPIRED: { code: 'TOKEN_EXPIRED', status: 401, message: 'Your session has expired. Please log in again.' },
  TOKEN_REVOKED: { code: 'TOKEN_REVOKED', status: 401, message: 'Your session has been revoked.' },
  PENDING_APPROVAL: { code: 'PENDING_APPROVAL', status: 403, message: 'Your account is pending admin approval.' },
  ACCOUNT_REVOKED: { code: 'ACCOUNT_REVOKED', status: 403, message: 'Your account has been revoked. Contact High Command.' },
  ACCOUNT_LOCKED: { code: 'ACCOUNT_LOCKED', status: 423, message: 'Account temporarily locked due to failed attempts.' },
  INSUFFICIENT_ROLE: { code: 'INSUFFICIENT_ROLE', status: 403, message: 'Insufficient permissions for this action.' },
  RATE_LIMITED: { code: 'RATE_LIMITED', status: 429, message: 'Too many requests. Please wait before trying again.' },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400, message: 'Invalid input.' },
  PASSWORD_POLICY_VIOLATION: { code: 'PASSWORD_POLICY_VIOLATION', status: 400, message: 'Password does not meet requirements.' },
  PASSWORD_PREVIOUSLY_USED: { code: 'PASSWORD_PREVIOUSLY_USED', status: 400, message: 'This password has been used recently.' },
  PASSWORD_TOO_SIMILAR: { code: 'PASSWORD_TOO_SIMILAR', status: 400, message: 'New password is too similar to the old one.' },
  FORCE_PASSWORD_CHANGE: { code: 'FORCE_PASSWORD_CHANGE', status: 200, message: 'You must change your password before continuing.' },
  APPROVAL_EXPIRED: { code: 'APPROVAL_EXPIRED', status: 410, message: 'This approval request has expired.' },
  SELF_APPROVAL_DENIED: { code: 'SELF_APPROVAL_DENIED', status: 403, message: 'You cannot approve your own request.' },
  RATIONALE_REQUIRED: { code: 'RATIONALE_REQUIRED', status: 400, message: 'A rationale is required (min 10 characters).' },
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

// ─── Approval Request Types ──────────────────────────────────────────────
export const APPROVAL_TYPES = {
  INITIAL_ACCESS: 'initial_access',
  REINSTATEMENT: 'reinstatement',
  ROLE_CHANGE: 'role_change',
} as const;

// ─── Role-Based Access Scopes ────────────────────────────────────────────
export const ROLE_SCOPES: Record<string, string[]> = {
  'Student': ['read:own_profile', 'read:roster_basic', 'write:own_loa', 'read:announcements'],
  'Patrol Officer': ['read:own_profile', 'read:roster_basic', 'write:own_loa', 'read:announcements'],
  'Supervisor': ['read:own_profile', 'read:roster_basic', 'write:own_loa', 'read:announcements', 'read:team_roster', 'write:team_notes', 'read:team_loa'],
  'Command': ['read:own_profile', 'read:roster_basic', 'write:own_loa', 'read:announcements', 'read:team_roster', 'write:team_notes', 'read:team_loa', 'read:department_full', 'write:disciplinary', 'read:audit_department'],
  'High Command': ['read:own_profile', 'read:roster_basic', 'write:own_loa', 'read:announcements', 'read:team_roster', 'write:team_notes', 'read:team_loa', 'read:department_full', 'write:disciplinary', 'read:audit_department', 'write:roster', 'write:approvals', 'read:audit_full', 'manage:department'],
  'HR': ['read:own_profile', 'read:roster_basic', 'write:own_loa', 'read:announcements', 'read:team_roster', 'write:team_notes', 'read:team_loa', 'read:department_full', 'write:disciplinary', 'read:audit_department', 'write:roster', 'write:approvals', 'read:audit_full', 'manage:department'],
  'admin': ['read:own_profile', 'read:roster_basic', 'write:own_loa', 'read:announcements', 'read:team_roster', 'write:team_notes', 'read:team_loa', 'read:department_full', 'write:disciplinary', 'read:audit_department', 'write:roster', 'write:approvals', 'read:audit_full', 'manage:department', 'manage:system', 'manage:roles', 'manage:audit'],
};

/**
 * Get scopes for a given role and admin status.
 */
export function getScopesForRole(role: string, isAdmin: boolean): string[] {
  if (isAdmin) return ROLE_SCOPES['admin'] || [];
  return ROLE_SCOPES[role] || ROLE_SCOPES['Student'] || [];
}
