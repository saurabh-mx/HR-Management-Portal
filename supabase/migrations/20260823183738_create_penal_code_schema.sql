-- Add description column and title_header column to penal_code table
ALTER TABLE penal_code ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE penal_code ADD COLUMN IF NOT EXISTS title_header TEXT DEFAULT '';

-- Drop the unique constraint on pc_number since title rows won't have one
ALTER TABLE penal_code DROP CONSTRAINT IF EXISTS penal_code_pc_number_key;
