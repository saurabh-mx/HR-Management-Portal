-- Migration to create the sub_department_posts table

CREATE TABLE IF NOT EXISTS public.sub_department_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_department TEXT NOT NULL,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sub_department_posts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read sub_department_posts"
    ON public.sub_department_posts FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert sub_department_posts"
    ON public.sub_department_posts FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update sub_department_posts"
    ON public.sub_department_posts FOR UPDATE
    TO authenticated
    USING (true);

-- Allow authenticated users to delete (we can restrict this in the app UI, or later refine RLS)
CREATE POLICY "Allow authenticated users to delete sub_department_posts"
    ON public.sub_department_posts FOR DELETE
    TO authenticated
    USING (true);
