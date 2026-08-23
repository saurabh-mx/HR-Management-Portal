-- Add description and title_header columns to penal_code table
ALTER TABLE penal_code ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE penal_code ADD COLUMN IF NOT EXISTS title_header TEXT DEFAULT '';

-- Drop the unique constraint on pc_number since title rows won't have one  
ALTER TABLE penal_code DROP CONSTRAINT IF EXISTS penal_code_pc_number_key;

-- Create RLS policy for insert (needed for client-side import)
CREATE POLICY "Enable insert for authenticated users" ON penal_code
    FOR INSERT WITH CHECK (true);

-- Create RLS policy for delete (needed for client-side import)
CREATE POLICY "Enable delete for authenticated users" ON penal_code
    FOR DELETE USING (true);
