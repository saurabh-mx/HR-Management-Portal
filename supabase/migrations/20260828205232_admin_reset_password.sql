CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION admin_reset_officer_password(
  target_officer_id UUID, 
  new_password TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_email TEXT;
  caller_role TEXT;
BEGIN
  -- 1. Check if caller is admin or High Command
  SELECT role INTO caller_role FROM public.employees WHERE id = auth.uid();
  IF caller_role NOT IN ('admin', 'High Command', 'HR') THEN
    RAISE EXCEPTION 'Unauthorized: Insufficient privileges to reset password';
  END IF;

  -- 2. Get the target's email
  SELECT username || '@hr-portal.internal' INTO target_email 
  FROM public.auth_credentials 
  WHERE officer_id = target_officer_id;

  IF target_email IS NULL THEN
    RAISE EXCEPTION 'Officer credentials not found';
  END IF;

  -- 3. Update auth.users directly (requires SECURITY DEFINER)
  UPDATE auth.users 
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE email = target_email;

  -- 4. Reset their custom auth_credentials state
  UPDATE public.auth_credentials 
  SET account_state = 'PENDING_INITIAL_LOGIN',
      is_first_login = true,
      failed_attempts = 0,
      locked_until = null
  WHERE officer_id = target_officer_id;

END;
$$;
