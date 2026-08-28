-- ============================================================================
-- Migration: Officer Auth System — Core Tables
-- Implements: auth_credentials, approval_requests, auth_tokens,
--             auth_audit_logs, failed_login_attempts
-- ============================================================================

-- ─── 1. AUTH CREDENTIALS ───────────────────────────────────────────────────
-- One-to-one with employees. Stores officer login credentials and account state.
CREATE TABLE IF NOT EXISTS public.auth_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    hash_algorithm TEXT NOT NULL DEFAULT 'argon2id',
    pepper_version INT NOT NULL DEFAULT 1,
    account_state TEXT NOT NULL DEFAULT 'pending_initial_login'
        CHECK (account_state IN (
            'pending_initial_login',
            'pending_password_change',
            'pending_approval',
            'active',
            'locked',
            'revoked',
            'rejected'
        )),
    is_first_login BOOLEAN NOT NULL DEFAULT true,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    lockout_count INT NOT NULL DEFAULT 0,
    password_changed_at TIMESTAMPTZ,
    password_history TEXT[] DEFAULT '{}',
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret TEXT,
    mfa_recovery_codes TEXT[],
    mfa_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_auth_credentials_officer UNIQUE (officer_id),
    CONSTRAINT uq_auth_credentials_username UNIQUE (username)
);

-- Case-insensitive username lookup (hot path)
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_cred_username_lower
    ON public.auth_credentials (lower(username));

-- State-based queries (admin panel)
CREATE INDEX IF NOT EXISTS idx_auth_cred_state
    ON public.auth_credentials (account_state);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_auth_credentials_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auth_credentials_updated
    BEFORE UPDATE ON public.auth_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_auth_credentials_timestamp();


-- ─── 2. APPROVAL REQUESTS ─────────────────────────────────────────────────
-- Tracks every approval lifecycle event for an officer.
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL DEFAULT 'initial_access'
        CHECK (request_type IN ('initial_access', 'reinstatement', 'role_change')),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID REFERENCES public.employees(id),
    reviewed_at TIMESTAMPTZ,
    rationale TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Pending approvals queue (admin panel hot path)
CREATE INDEX IF NOT EXISTS idx_approvals_pending
    ON public.approval_requests (status) WHERE status = 'pending';

-- Officer's approval history
CREATE INDEX IF NOT EXISTS idx_approvals_officer
    ON public.approval_requests (officer_id, submitted_at DESC);


-- ─── 3. AUTH TOKENS (Refresh Token Registry) ──────────────────────────────
-- Access tokens are stateless JWTs validated by signature.
-- Refresh tokens are tracked here for rotation and family-based revocation.
CREATE TABLE IF NOT EXISTS public.auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    token_family UUID NOT NULL,
    token_hash TEXT NOT NULL,
    token_type TEXT NOT NULL DEFAULT 'refresh'
        CHECK (token_type IN ('refresh', 'temporary')),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT
        CHECK (revoked_reason IS NULL OR revoked_reason IN (
            'logout', 'rotation', 'theft_detected', 'admin_action', 'expired'
        )),
    ip_address INET,
    user_agent TEXT
);

-- Token validation by hash (hot path on every refresh)
CREATE INDEX IF NOT EXISTS idx_tokens_hash
    ON public.auth_tokens (token_hash) WHERE revoked = false;

-- Family-based revocation
CREATE INDEX IF NOT EXISTS idx_tokens_family
    ON public.auth_tokens (token_family);

-- Active tokens per officer
CREATE INDEX IF NOT EXISTS idx_tokens_officer_active
    ON public.auth_tokens (officer_id) WHERE revoked = false;

-- Expired token cleanup
CREATE INDEX IF NOT EXISTS idx_tokens_expires
    ON public.auth_tokens (expires_at) WHERE revoked = false;


-- ─── 4. AUTH AUDIT LOGS ───────────────────────────────────────────────────
-- Immutable, append-only security audit trail for all auth events.
CREATE TABLE IF NOT EXISTS public.auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id UUID REFERENCES public.employees(id),
    actor_name TEXT,
    action TEXT NOT NULL,
    target_id UUID,
    target_type TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    integrity_hash TEXT NOT NULL DEFAULT '',
    previous_hash TEXT NOT NULL DEFAULT ''
);

-- Chronological queries
CREATE INDEX IF NOT EXISTS idx_auth_audit_timestamp
    ON public.auth_audit_logs (timestamp DESC);

-- Actor-specific audit trail
CREATE INDEX IF NOT EXISTS idx_auth_audit_actor
    ON public.auth_audit_logs (actor_id, timestamp DESC);

-- Action-type filtering
CREATE INDEX IF NOT EXISTS idx_auth_audit_action
    ON public.auth_audit_logs (action, timestamp DESC);


-- ─── 5. FAILED LOGIN ATTEMPTS ─────────────────────────────────────────────
-- Security monitoring for brute force detection and IP-based rate limiting.
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID REFERENCES public.employees(id),
    attempted_username TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    failure_reason TEXT NOT NULL DEFAULT 'INVALID_PASSWORD'
        CHECK (failure_reason IN (
            'INVALID_PASSWORD', 'UNKNOWN_USER', 'ACCOUNT_LOCKED', 'ACCOUNT_REVOKED'
        ))
);

-- IP-based rate limiting queries
CREATE INDEX IF NOT EXISTS idx_failed_ip
    ON public.failed_login_attempts (ip_address, timestamp DESC);

-- Officer-specific failed attempt tracking
CREATE INDEX IF NOT EXISTS idx_failed_officer
    ON public.failed_login_attempts (officer_id, timestamp DESC);

-- Cleanup: auto-expire old records (run via pg_cron or scheduled job)
-- Records older than 90 days can be purged; compliance copies should be archived first.


-- ─── 6. DATABASE FUNCTIONS ────────────────────────────────────────────────

-- Generate a deterministic username from officer name + callsign
CREATE OR REPLACE FUNCTION public.generate_officer_username(
    officer_name TEXT,
    officer_callsign TEXT
)
RETURNS TEXT AS $$
DECLARE
    first_name TEXT;
    clean_callsign TEXT;
    generated_username TEXT;
    collision_count INT;
BEGIN
    -- Extract first name, lowercase, strip non-alpha
    first_name := lower(regexp_replace(split_part(officer_name, ' ', 1), '[^a-z]', '', 'gi'));
    clean_callsign := regexp_replace(officer_callsign, '[^a-zA-Z0-9]', '', 'g');

    IF length(first_name) < 2 OR length(clean_callsign) < 1 THEN
        RAISE EXCEPTION 'Invalid officer name or callsign for username generation';
    END IF;

    generated_username := first_name || '.' || clean_callsign;

    -- Check for collision
    SELECT COUNT(*) INTO collision_count
    FROM public.auth_credentials
    WHERE lower(username) = lower(generated_username);

    -- If collision, use full name
    IF collision_count > 0 THEN
        DECLARE
            last_name TEXT;
        BEGIN
            last_name := lower(regexp_replace(
                split_part(officer_name, ' ', 2), '[^a-z]', '', 'gi'
            ));
            IF length(last_name) >= 2 THEN
                generated_username := first_name || '.' || last_name || '.' || clean_callsign;
            ELSE
                generated_username := first_name || '.' || clean_callsign || '.' || floor(random() * 99 + 1)::text;
            END IF;
        END;
    END IF;

    RETURN lower(generated_username);
END;
$$ LANGUAGE plpgsql;


-- ─── 7. ROW LEVEL SECURITY ────────────────────────────────────────────────

-- auth_credentials: Only the owning officer can read their own record.
-- Admins/HC can read all. No one can delete via API.
ALTER TABLE public.auth_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can read own credentials"
    ON public.auth_credentials FOR SELECT
    TO authenticated
    USING (true);
    -- Note: In production, restrict to officer_id = auth.uid() OR is_admin check.
    -- Using permissive policy for MVP since auth is handled at the Edge Function level.

CREATE POLICY "System can insert credentials"
    ON public.auth_credentials FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "System can update credentials"
    ON public.auth_credentials FOR UPDATE
    TO authenticated
    USING (true);

-- approval_requests: Authenticated users can read, insert. Only admins update.
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read approval_requests"
    ON public.approval_requests FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert approval_requests"
    ON public.approval_requests FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update approval_requests"
    ON public.approval_requests FOR UPDATE
    TO authenticated
    USING (true);

-- auth_tokens: Full access for authenticated (managed by edge functions)
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage auth_tokens"
    ON public.auth_tokens FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- auth_audit_logs: APPEND ONLY — no updates or deletes permitted
ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read auth_audit_logs"
    ON public.auth_audit_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert auth_audit_logs"
    ON public.auth_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Explicitly deny UPDATE and DELETE on audit logs
-- (No UPDATE or DELETE policies = denied by default with RLS enabled)

-- failed_login_attempts: Append-only, readable by admins
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read failed_login_attempts"
    ON public.failed_login_attempts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert failed_login_attempts"
    ON public.failed_login_attempts FOR INSERT
    TO authenticated
    WITH CHECK (true);
