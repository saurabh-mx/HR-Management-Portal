-- Create a secure public view that exposes only safe fields from the employees table
-- This ensures that even if the client tampers with the query, only these fields are visible to anonymous users.

CREATE OR REPLACE VIEW public_identity AS
SELECT
  badge_number,
  name,
  rank,
  department,
  status,
  avatar_url,
  cert_fto,
  cert_asd,
  cert_heat,
  cert_swat,
  cert_cid,
  cert_meu,
  cert_k9,
  cert_sop
FROM employees;

-- Grant read access to both anonymous and authenticated users
GRANT SELECT ON public_identity TO anon;
GRANT SELECT ON public_identity TO authenticated;
