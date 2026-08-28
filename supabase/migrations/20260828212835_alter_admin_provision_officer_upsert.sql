-- Function to bulk provision or RESET an officer's password
CREATE OR REPLACE FUNCTION admin_provision_officer(
  p_officer_id UUID,
  p_username TEXT,
  p_password TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT := p_username || '@hr-portal.internal';
  v_user_id UUID;
BEGIN
  -- 1. Upsert into auth.users (update password if exists)
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    UPDATE auth.users 
    SET encrypted_password = crypt(p_password, gen_salt('bf'))
    WHERE email = v_email;
  ELSE
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, raw_user_meta_data, is_sso_user
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
      v_email, crypt(p_password, gen_salt('bf')), now(), now(), now(), 
      json_build_object('officer_id', p_officer_id, 'username', p_username)::jsonb,
      false
    );
  END IF;

  -- 2. Upsert into public.auth_credentials
  IF EXISTS (SELECT 1 FROM public.auth_credentials WHERE officer_id = p_officer_id) THEN
    UPDATE public.auth_credentials
    SET account_state = 'pending_initial_login',
        is_first_login = true,
        failed_attempts = 0,
        locked_until = null
    WHERE officer_id = p_officer_id;
  ELSE
    INSERT INTO public.auth_credentials (
      officer_id, username, password_hash, hash_algorithm, account_state, is_first_login,
      created_at, updated_at
    ) VALUES (
      p_officer_id, p_username, '[managed-by-supabase-auth]', 'argon2id', 'pending_initial_login', true,
      now(), now()
    );
  END IF;
END;
$$;
