/**
 * Auth Types
 * TypeScript interfaces for the officer auth system.
 */

import type { AccountState, AuthAction, AuthErrorCode } from './constants';

// ─── Database Records ─────────────────────────────────────────────────────

export interface AuthCredential {
  id: string;
  officer_id: string;
  username: string;
  password_hash: string;
  hash_algorithm: 'argon2id' | 'bcrypt';
  pepper_version: number;
  account_state: AccountState;
  is_first_login: boolean;
  failed_attempts: number;
  locked_until: string | null;
  lockout_count: number;
  password_changed_at: string | null;
  password_history: string[];
  mfa_enabled: boolean;
  mfa_secret: string | null;
  mfa_recovery_codes: string[] | null;
  mfa_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  officer_id: string;
  request_type: 'initial_access' | 'reinstatement' | 'role_change';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rationale: string | null;
  metadata: Record<string, any>;
  expires_at: string;
  // Joined fields (from employees table)
  officer_name?: string;
  officer_callsign?: string;
  officer_badge?: string;
  officer_department?: string;
  officer_discord_tag?: string;
  reviewer_name?: string;
}

export interface AuthToken {
  id: string;
  officer_id: string;
  token_family: string;
  token_hash: string;
  token_type: 'refresh' | 'temporary';
  issued_at: string;
  expires_at: string;
  revoked: boolean;
  revoked_at: string | null;
  revoked_reason: 'logout' | 'rotation' | 'theft_detected' | 'admin_action' | 'expired' | null;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AuthAuditLog {
  id: string;
  timestamp: string;
  actor_id: string | null;
  actor_name: string | null;
  action: AuthAction;
  target_id: string | null;
  target_type: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  integrity_hash: string;
  previous_hash: string;
}

export interface FailedLoginAttempt {
  id: string;
  officer_id: string | null;
  attempted_username: string;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
  failure_reason: 'INVALID_PASSWORD' | 'UNKNOWN_USER' | 'ACCOUNT_LOCKED' | 'ACCOUNT_REVOKED';
}

// ─── Auth Flow Types ──────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
  mfa_code?: string;
}

export interface LoginResponse {
  action: 'AUTHENTICATED' | 'FORCE_PASSWORD_CHANGE' | 'MFA_REQUIRED' | 'PENDING_APPROVAL';
  access_token?: string;
  temporary_token?: string;
  expires_in?: number;
  officer?: OfficerProfile;
  officer_id?: string;
  message?: string;
  approval_request_id?: string;
  submitted_at?: string;
  remaining_attempts?: number;
}

export interface PasswordChangeRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordChangeResponse {
  message: string;
  account_state: AccountState;
  approval_request_id?: string;
}

export interface OfficerProfile {
  id: string;
  name: string;
  callsign: string;
  department: string;
  role: string;
  badge_number: string;
  is_admin: boolean;
}

export interface ApprovalAction {
  rationale: string;
  grant_scopes?: string[];
}

export interface ApprovalActionResponse {
  message: string;
  officer_id: string;
  new_state: AccountState;
  granted_scopes?: string[];
}

// ─── Auth Error Type ──────────────────────────────────────────────────────

export interface AuthErrorResponse {
  error: AuthErrorCode | string;
  message: string;
  details?: Record<string, any>;
  request_id?: string;
  timestamp?: string;
  remaining_attempts?: number;
}

// ─── Token Claims ─────────────────────────────────────────────────────────

export interface AccessTokenClaims {
  sub: string;           // officer UUID
  iss: string;           // 'hr-portal-auth'
  iat: number;
  exp: number;
  jti: string;           // unique token ID
  role: string;
  department: string;
  callsign: string;
  badge: string;
  scope: string[];
  is_admin: boolean;
  token_family: string;
}

// ─── Auth Context State ───────────────────────────────────────────────────

export interface OfficerAuthState {
  /** Whether the officer is authenticated via custom auth (vs Discord OAuth) */
  isCustomAuth: boolean;
  /** Current account state in the state machine */
  accountState: AccountState | null;
  /** The officer's profile from auth system */
  officerProfile: OfficerProfile | null;
  /** Current access token (stored in memory only) */
  accessToken: string | null;
  /** Temporary token for password change / MFA */
  temporaryToken: string | null;
  /** ID of the current approval request, if pending */
  approvalRequestId: string | null;
  /** Loading state for auth operations */
  authLoading: boolean;
  /** Auth error */
  authError: AuthErrorResponse | null;
}
