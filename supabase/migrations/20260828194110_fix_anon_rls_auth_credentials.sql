-- Allow the frontend (anon key) to read auth_credentials to check lock status during login
CREATE POLICY "Anon can read auth credentials for login"
    ON public.auth_credentials FOR SELECT
    TO anon
    USING (true);
