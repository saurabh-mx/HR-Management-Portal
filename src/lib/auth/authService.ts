/**
 * Auth Service
 * Core authentication orchestrator for the officer login system.
 * Communicates with Supabase (direct DB) for MVP. Edge Functions added in Phase 2.
 */

import { supabase } from '@/lib/supabase/supabaseClient';
import { ACCOUNT_STATES, AUTH_ACTIONS, AUTH_ERRORS, TOKEN_CONFIG, LOCKOUT_POLICY, getScopesForRole } from './constants';
import { validatePassword, validatePasswordDifference } from './passwordService';
import type {
  AuthCredential,
  LoginRequest,
  LoginResponse,
  PasswordChangeRequest,
  PasswordChangeResponse,
  ApprovalRequest,
  ApprovalAction,
  ApprovalActionResponse,
  OfficerProfile,
} from './types';

// ─── Custom Auth Error ────────────────────────────────────────────────────

class AuthError extends Error {
  code: string;
  status: number;
  details?: Record<string, any>;

  constructor(code: keyof typeof AUTH_ERRORS, details?: Record<string, any>) {
    const errorDef = AUTH_ERRORS[code];
    super(errorDef.message);
    this.code = errorDef.code;
    this.status = errorDef.status;
    this.details = details;
    this.name = 'AuthError';
  }
}

// ─── Authentication ───────────────────────────────────────────────────────

/**
 * Authenticate an officer with username and password.
 * 
 * MVP Implementation: Uses Supabase's built-in auth for password verification
 * by registering officers as Supabase auth users with their derived email.
 * The auth_credentials table tracks the state machine.
 */
export async function authenticateOfficer(request: LoginRequest): Promise<LoginResponse> {
  const normalizedUsername = request.username.trim().toLowerCase();

  // 1. Look up the credential record
  const { data: credential, error: credError } = await supabase
    .from('auth_credentials')
    .select('*')
    .eq('username', normalizedUsername)
    .maybeSingle();

  if (credError) {
    console.error('Auth lookup error:', credError);
    throw new AuthError('INVALID_CREDENTIALS');
  }

  if (!credential) {
    // Officer not found — return generic error to prevent enumeration
    throw new AuthError('INVALID_CREDENTIALS');
  }

  const cred = credential as AuthCredential;

  // 2. Check lockout state
  if (cred.account_state === ACCOUNT_STATES.LOCKED) {
    if (cred.locked_until && new Date(cred.locked_until) > new Date()) {
      throw new AuthError('ACCOUNT_LOCKED');
    }
    // Auto-unlock: lockout duration has expired
    await supabase.from('auth_credentials').update({
      account_state: ACCOUNT_STATES.ACTIVE,
      failed_attempts: 0,
      locked_until: null,
    }).eq('id', cred.id);
    cred.account_state = ACCOUNT_STATES.ACTIVE;
    cred.failed_attempts = 0;
  }

  if (cred.account_state === ACCOUNT_STATES.REVOKED) {
    throw new AuthError('ACCOUNT_REVOKED');
  }

  // 3. Verify password via Supabase Auth
  // The officer's Supabase auth email is derived: username@hr-portal.internal
  const authEmail = `${normalizedUsername}@hr-portal.internal`;

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password: request.password,
  });

  if (signInError || !signInData.session) {
    // Password verification failed
    const newAttempts = cred.failed_attempts + 1;
    const updates: Record<string, any> = { failed_attempts: newAttempts };

    if (newAttempts >= LOCKOUT_POLICY.MAX_FAILED_ATTEMPTS) {
      updates.account_state = ACCOUNT_STATES.LOCKED;
      updates.locked_until = new Date(Date.now() + LOCKOUT_POLICY.LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
      updates.lockout_count = cred.lockout_count + 1;

      if (updates.lockout_count >= LOCKOUT_POLICY.MAX_LOCKOUTS_PER_DAY) {
        updates.locked_until = null; // Permanent lock until admin
      }
    }

    await supabase.from('auth_credentials').update(updates).eq('id', cred.id);

    // Log failed attempt
    await logFailedAttempt(cred.officer_id, normalizedUsername, 'INVALID_PASSWORD');
    await logAuthEvent(AUTH_ACTIONS.LOGIN_FAILED, cred.officer_id, { reason: 'INVALID_PASSWORD', attempts: newAttempts });

    throw new AuthError('INVALID_CREDENTIALS', {
      remaining_attempts: Math.max(0, LOCKOUT_POLICY.MAX_FAILED_ATTEMPTS - newAttempts),
    });
  }

  // 4. Successful password verification — reset failed attempts
  await supabase.from('auth_credentials').update({ failed_attempts: 0 }).eq('id', cred.id);

  // 5. Handle first login → force password change
  if (cred.is_first_login || cred.account_state === ACCOUNT_STATES.PENDING_INITIAL_LOGIN) {
    await supabase.from('auth_credentials').update({
      account_state: ACCOUNT_STATES.PENDING_PASSWORD_CHANGE,
    }).eq('id', cred.id);

    await logAuthEvent(AUTH_ACTIONS.FIRST_LOGIN, cred.officer_id);

    // Sign out the temporary Supabase session — we'll use our own temp token
    // The Supabase session stays active for the password change operation
    return {
      action: 'FORCE_PASSWORD_CHANGE',
      temporary_token: signInData.session.access_token,
      expires_in: TOKEN_CONFIG.TEMPORARY_TOKEN_LIFETIME_SECONDS,
      message: AUTH_ERRORS.FORCE_PASSWORD_CHANGE.message,
      officer_id: cred.officer_id,
    };
  }

  // 6. Handle pending password change state
  if (cred.account_state === ACCOUNT_STATES.PENDING_PASSWORD_CHANGE) {
    return {
      action: 'FORCE_PASSWORD_CHANGE',
      temporary_token: signInData.session.access_token,
      expires_in: TOKEN_CONFIG.TEMPORARY_TOKEN_LIFETIME_SECONDS,
      message: AUTH_ERRORS.FORCE_PASSWORD_CHANGE.message,
      officer_id: cred.officer_id,
    };
  }

  // 7. Check approval state
  if (cred.account_state === ACCOUNT_STATES.PENDING_APPROVAL) {
    // Sign out — they shouldn't have a session yet
    await supabase.auth.signOut();

    // Find their pending approval request
    const { data: pendingApproval } = await supabase
      .from('approval_requests')
      .select('id, submitted_at')
      .eq('officer_id', cred.officer_id)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    await logAuthEvent(AUTH_ACTIONS.LOGIN_FAILED, cred.officer_id, { reason: 'PENDING_APPROVAL' });

    return {
      action: 'PENDING_APPROVAL',
      message: AUTH_ERRORS.PENDING_APPROVAL.message,
      approval_request_id: pendingApproval?.id,
      submitted_at: pendingApproval?.submitted_at,
      officer_id: cred.officer_id,
    };
  }

  if (cred.account_state === ACCOUNT_STATES.REJECTED) {
    await supabase.auth.signOut();
    throw new AuthError('ACCOUNT_REVOKED');
  }

  // 8. Check password expiry (soft)
  if (cred.password_changed_at) {
    const changedAt = new Date(cred.password_changed_at);
    const expiryDate = new Date(changedAt.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
    if (new Date() > expiryDate) {
      await supabase.from('auth_credentials').update({
        account_state: ACCOUNT_STATES.PENDING_PASSWORD_CHANGE,
      }).eq('id', cred.id);

      return {
        action: 'FORCE_PASSWORD_CHANGE',
        temporary_token: signInData.session.access_token,
        expires_in: TOKEN_CONFIG.TEMPORARY_TOKEN_LIFETIME_SECONDS,
        message: 'Your password has expired. Please set a new password.',
        officer_id: cred.officer_id,
      };
    }
  }

  // 9. Fully authenticated — get officer profile
  const profile = await getOfficerProfile(cred.officer_id);

  await logAuthEvent(AUTH_ACTIONS.LOGIN_SUCCESS, cred.officer_id);

  return {
    action: 'AUTHENTICATED',
    access_token: signInData.session.access_token,
    expires_in: TOKEN_CONFIG.ACCESS_TOKEN_LIFETIME_SECONDS,
    officer: profile,
    officer_id: cred.officer_id,
  };
}

// ─── Password Change ──────────────────────────────────────────────────────

/**
 * Change officer password. Handles both first-login and regular password changes.
 */
export async function changeOfficerPassword(
  officerId: string,
  request: PasswordChangeRequest,
): Promise<PasswordChangeResponse> {
  // 1. Validate new password matches confirmation
  if (request.new_password !== request.confirm_password) {
    throw new AuthError('VALIDATION_ERROR', { confirm_password: 'Passwords do not match.' });
  }

  // 2. Validate password policy
  const validation = validatePassword(request.new_password);
  if (!validation.valid) {
    throw new AuthError('PASSWORD_POLICY_VIOLATION', { errors: validation.errors });
  }

  // 3. Check similarity
  if (!validatePasswordDifference(request.old_password, request.new_password)) {
    throw new AuthError('PASSWORD_TOO_SIMILAR');
  }

  // 4. Get current credential record
  const { data: credential, error } = await supabase
    .from('auth_credentials')
    .select('*')
    .eq('officer_id', officerId)
    .maybeSingle();

  if (error || !credential) {
    throw new AuthError('INVALID_CREDENTIALS');
  }

  const cred = credential as AuthCredential;

  // 5. Update password via Supabase Auth
  const { error: updateError } = await supabase.auth.updateUser({
    password: request.new_password,
    // Supabase requires the current password for security when updating passwords
    current_password: request.old_password,
  } as any);

  if (updateError) {
    await logAuthEvent(AUTH_ACTIONS.PASSWORD_CHANGE_FAILED, officerId, { reason: updateError.message });
    throw new AuthError('VALIDATION_ERROR', { message: updateError.message });
  }

  // 6. Determine next state
  const isFirstLoginFlow = cred.is_first_login || cred.account_state === ACCOUNT_STATES.PENDING_PASSWORD_CHANGE;
  const nextState = isFirstLoginFlow ? ACCOUNT_STATES.PENDING_APPROVAL : ACCOUNT_STATES.ACTIVE;

  // 7. Update auth_credentials record
  await supabase.from('auth_credentials').update({
    is_first_login: false,
    account_state: nextState,
    password_changed_at: new Date().toISOString(),
  }).eq('id', cred.id);

  let approvalRequestId: string | undefined;

  // 8. Create approval request if transitioning to PENDING_APPROVAL
  if (nextState === ACCOUNT_STATES.PENDING_APPROVAL) {
    const { data: approvalData } = await supabase.from('approval_requests').insert({
      officer_id: officerId,
      request_type: 'initial_access',
      status: 'pending',
    }).select('id').single();

    approvalRequestId = approvalData?.id;

    // Sign out — they'll need to wait for approval
    await supabase.auth.signOut();
  }

  // 9. Audit log
  await logAuthEvent(AUTH_ACTIONS.PASSWORD_CHANGED, officerId, {
    first_login_flow: isFirstLoginFlow,
    next_state: nextState,
  });

  return {
    message: isFirstLoginFlow
      ? 'Password changed successfully. Your account is now pending admin approval.'
      : 'Password changed successfully.',
    account_state: nextState,
    approval_request_id: approvalRequestId,
  };
}

// ─── Approval Actions ─────────────────────────────────────────────────────

/**
 * Get pending approval requests with joined officer data.
 */
export async function getPendingApprovals(): Promise<ApprovalRequest[]> {
  const { data, error } = await supabase
    .from('approval_requests')
    .select(`
      *,
      officer:employees!approval_requests_officer_id_fkey (
        name, callsign, badge_number, department, discord_tag
      )
    `)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch pending approvals:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    officer_name: row.officer?.name,
    officer_callsign: row.officer?.callsign,
    officer_badge: row.officer?.badge_number,
    officer_department: row.officer?.department,
    officer_discord_tag: row.officer?.discord_tag,
  }));
}

/**
 * Get approval history with pagination.
 */
export async function getApprovalHistory(page: number = 0, pageSize: number = 25): Promise<{
  data: ApprovalRequest[];
  total: number;
}> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('approval_requests')
    .select(`
      *,
      officer:employees!approval_requests_officer_id_fkey (
        name, callsign, badge_number, department
      ),
      reviewer:employees!approval_requests_reviewed_by_fkey (
        name
      )
    `, { count: 'exact' })
    .neq('status', 'pending')
    .order('reviewed_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Failed to fetch approval history:', error);
    return { data: [], total: 0 };
  }

  return {
    data: (data || []).map((row: any) => ({
      ...row,
      officer_name: row.officer?.name,
      officer_callsign: row.officer?.callsign,
      officer_badge: row.officer?.badge_number,
      officer_department: row.officer?.department,
      reviewer_name: row.reviewer?.name,
    })),
    total: count || 0,
  };
}

/**
 * Approve an officer's access request.
 */
export async function approveOfficerRequest(
  approvalId: string,
  reviewerId: string,
  action: ApprovalAction
): Promise<ApprovalActionResponse> {
  // 1. Validate rationale
  if (!action.rationale || action.rationale.trim().length < 10) {
    throw new AuthError('RATIONALE_REQUIRED');
  }

  // 2. Fetch the approval request
  const { data: request, error } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('id', approvalId)
    .maybeSingle();

  if (error || !request) {
    throw new AuthError('VALIDATION_ERROR', { message: 'Approval request not found.' });
  }

  // 3. Idempotency: already processed
  if (request.status !== 'pending') {
    return {
      message: 'This request has already been processed.',
      officer_id: request.officer_id,
      new_state: ACCOUNT_STATES.ACTIVE,
    };
  }

  // 4. Check expiry
  if (request.expires_at && new Date(request.expires_at) < new Date()) {
    throw new AuthError('APPROVAL_EXPIRED');
  }

  // 5. Prevent self-approval
  if (request.officer_id === reviewerId) {
    throw new AuthError('SELF_APPROVAL_DENIED');
  }

  // 6. Get officer's role for scope assignment
  const { data: officer } = await supabase
    .from('employees')
    .select('role, is_admin')
    .eq('id', request.officer_id)
    .maybeSingle();

  const scopes = action.grant_scopes || getScopesForRole(officer?.role || 'Student', officer?.is_admin || false);

  // 7. Update approval request
  await supabase.from('approval_requests').update({
    status: 'approved',
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
    rationale: action.rationale.trim(),
    metadata: { granted_scopes: scopes },
  }).eq('id', approvalId);

  // 8. Activate officer account
  await supabase.from('auth_credentials').update({
    account_state: ACCOUNT_STATES.ACTIVE,
  }).eq('officer_id', request.officer_id);

  // 9. Also update the employees claim_status for backward compatibility
  await supabase.from('employees').update({
    claim_status: 'approved',
  }).eq('id', request.officer_id);

  // 10. Audit log
  await logAuthEvent(AUTH_ACTIONS.APPROVAL_GRANTED, reviewerId, {
    target_officer: request.officer_id,
    approval_id: approvalId,
    rationale: action.rationale.trim(),
    scopes,
  });

  return {
    message: 'Officer access approved.',
    officer_id: request.officer_id,
    new_state: ACCOUNT_STATES.ACTIVE,
    granted_scopes: scopes,
  };
}

/**
 * Reject an officer's access request.
 */
export async function rejectOfficerRequest(
  approvalId: string,
  reviewerId: string,
  rationale: string,
): Promise<ApprovalActionResponse> {
  if (!rationale || rationale.trim().length < 10) {
    throw new AuthError('RATIONALE_REQUIRED');
  }

  const { data: request, error } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('id', approvalId)
    .maybeSingle();

  if (error || !request) {
    throw new AuthError('VALIDATION_ERROR', { message: 'Approval request not found.' });
  }

  if (request.status !== 'pending') {
    return {
      message: 'This request has already been processed.',
      officer_id: request.officer_id,
      new_state: ACCOUNT_STATES.REJECTED,
    };
  }

  if (request.officer_id === reviewerId) {
    throw new AuthError('SELF_APPROVAL_DENIED');
  }

  await supabase.from('approval_requests').update({
    status: 'rejected',
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
    rationale: rationale.trim(),
  }).eq('id', approvalId);

  await supabase.from('auth_credentials').update({
    account_state: ACCOUNT_STATES.REJECTED,
  }).eq('officer_id', request.officer_id);

  await supabase.from('employees').update({
    claim_status: 'rejected',
  }).eq('id', request.officer_id);

  await logAuthEvent(AUTH_ACTIONS.APPROVAL_REJECTED, reviewerId, {
    target_officer: request.officer_id,
    approval_id: approvalId,
    rationale: rationale.trim(),
  });

  return {
    message: 'Officer access rejected.',
    officer_id: request.officer_id,
    new_state: ACCOUNT_STATES.REJECTED,
  };
}

// ─── Admin Account Management ─────────────────────────────────────────────

/**
 * Create officer credentials when an admin onboards a new officer.
 * Generates username, registers in Supabase Auth, creates auth_credentials record.
 */
export async function createOfficerCredentials(
  officerId: string,
  officerName: string,
  callsign: string,
  initialPassword: string,
): Promise<{ username: string; authEmail: string }> {
  // 1. Generate username
  const { data: usernameData, error: usernameError } = await supabase
    .rpc('generate_officer_username', {
      officer_name: officerName,
      officer_callsign: callsign,
    });

  if (usernameError) {
    console.error('Username generation failed:', usernameError);
    throw new Error('Failed to generate username.');
  }

  const username = usernameData as string;
  const authEmail = `${username}@hr-portal.internal`;

  // 2. Register in Supabase Auth
  const { error: signUpError } = await supabase.auth.admin.createUser({
    email: authEmail,
    password: initialPassword,
    email_confirm: true,
    user_metadata: {
      officer_id: officerId,
      username: username,
      callsign: callsign,
    },
  });

  // If admin.createUser is not available (client-side), use signUp
  if (signUpError) {
    // Fallback: This requires server-side implementation
    console.warn('Admin createUser not available. Officer credential creation should be done server-side.');
  }

  // 3. Create auth_credentials record
  const { error: credError } = await supabase.from('auth_credentials').insert({
    officer_id: officerId,
    username: username,
    password_hash: '[managed-by-supabase-auth]',
    hash_algorithm: 'argon2id',
    account_state: ACCOUNT_STATES.PENDING_INITIAL_LOGIN,
    is_first_login: true,
  });

  if (credError) {
    console.error('Failed to create auth credentials:', credError);
    throw new Error('Failed to create officer credentials.');
  }

  await logAuthEvent(AUTH_ACTIONS.APPROVAL_SUBMITTED, officerId, {
    username,
    action: 'credentials_created',
  });

  return { username, authEmail };
}

/**
 * Unlock a locked officer account.
 */
export async function unlockOfficerAccount(officerId: string, adminId: string): Promise<void> {
  await supabase.from('auth_credentials').update({
    account_state: ACCOUNT_STATES.ACTIVE,
    failed_attempts: 0,
    locked_until: null,
    lockout_count: 0,
  }).eq('officer_id', officerId);

  await logAuthEvent(AUTH_ACTIONS.ACCOUNT_UNLOCKED, adminId, { target_officer: officerId });
}

/**
 * Revoke an officer's access.
 */
export async function revokeOfficerAccess(officerId: string, adminId: string, reason: string): Promise<void> {
  await supabase.from('auth_credentials').update({
    account_state: ACCOUNT_STATES.REVOKED,
  }).eq('officer_id', officerId);

  // Revoke all active tokens
  await supabase.from('auth_tokens').update({
    revoked: true,
    revoked_at: new Date().toISOString(),
    revoked_reason: 'admin_action',
  }).eq('officer_id', officerId).eq('revoked', false);

  await logAuthEvent(AUTH_ACTIONS.ACCOUNT_REVOKED, adminId, {
    target_officer: officerId,
    reason,
  });
}

/**
 * Get an officer's auth credential state.
 */
export async function getOfficerAuthState(officerId: string): Promise<AuthCredential | null> {
  const { data, error } = await supabase
    .from('auth_credentials')
    .select('*')
    .eq('officer_id', officerId)
    .maybeSingle();

  if (error || !data) return null;
  return data as AuthCredential;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

async function getOfficerProfile(officerId: string): Promise<OfficerProfile> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, callsign, department, role, badge_number, is_admin')
    .eq('id', officerId)
    .single();

  if (error || !data) {
    throw new Error('Officer profile not found.');
  }

  return {
    id: data.id,
    name: data.name,
    callsign: data.callsign || '',
    department: data.department || '',
    role: data.role || 'Student',
    badge_number: data.badge_number || '',
    is_admin: data.is_admin || false,
  };
}

async function logFailedAttempt(
  officerId: string | null,
  attemptedUsername: string,
  reason: string,
): Promise<void> {
  try {
    await supabase.from('failed_login_attempts').insert({
      officer_id: officerId,
      attempted_username: attemptedUsername,
      failure_reason: reason,
    });
  } catch (err) {
    console.error('Failed to log failed login attempt:', err);
  }
}

async function logAuthEvent(
  action: string,
  actorId: string | null,
  details: Record<string, any> = {},
): Promise<void> {
  try {
    await supabase.from('auth_audit_logs').insert({
      actor_id: actorId,
      action,
      details,
      integrity_hash: '',
      previous_hash: '',
    });
  } catch (err) {
    // Audit logging must never block authentication
    console.error('Failed to write auth audit log:', err);
  }
}

// ─── Export Error Class ───────────────────────────────────────────────────

export { AuthError };
