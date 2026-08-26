-- Migration to create the soi_applications table

CREATE TABLE IF NOT EXISTS public.soi_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_name TEXT NOT NULL,
    department TEXT NOT NULL,
    current_rank TEXT NOT NULL,
    target_sub_department TEXT NOT NULL,
    summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending Review',
    reviewed_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.soi_applications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read soi_applications
CREATE POLICY "Allow authenticated users to read soi_applications"
    ON public.soi_applications FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert soi_applications"
    ON public.soi_applications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update soi_applications"
    ON public.soi_applications FOR UPDATE
    TO authenticated
    USING (true);

-- Allow authenticated users to delete (admin only)
CREATE POLICY "Allow authenticated users to delete soi_applications"
    ON public.soi_applications FOR DELETE
    TO authenticated
    USING (true);
