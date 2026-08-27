-- Enable RLS and create standard policies for unrestricted tables

DO $$ 
DECLARE
    t_name text;
    pol_name text;
    tables text[] := ARRAY[
        'Announcements',
        'employees',
        'hr_comments',
        'hr_requests',
        'loa_requests',
        'meetings',
        'promotions',
        'strikes'
    ];
BEGIN
    FOR i IN 1 .. array_length(tables, 1) LOOP
        t_name := tables[i];
        
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);
        
        -- SELECT Policy
        pol_name := 'Allow authenticated users to read ' || t_name;
        EXECUTE format('
            DO $policy$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE schemaname = ''public'' 
                    AND tablename = %L 
                    AND policyname = %L
                ) THEN
                    CREATE POLICY %I
                        ON public.%I FOR SELECT
                        TO authenticated
                        USING (true);
                END IF;
            END $policy$;
        ', t_name, pol_name, pol_name, t_name);

        -- INSERT Policy
        pol_name := 'Allow authenticated users to insert ' || t_name;
        EXECUTE format('
            DO $policy$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE schemaname = ''public'' 
                    AND tablename = %L 
                    AND policyname = %L
                ) THEN
                    CREATE POLICY %I
                        ON public.%I FOR INSERT
                        TO authenticated
                        WITH CHECK (true);
                END IF;
            END $policy$;
        ', t_name, pol_name, pol_name, t_name);

        -- UPDATE Policy
        pol_name := 'Allow authenticated users to update ' || t_name;
        EXECUTE format('
            DO $policy$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE schemaname = ''public'' 
                    AND tablename = %L 
                    AND policyname = %L
                ) THEN
                    CREATE POLICY %I
                        ON public.%I FOR UPDATE
                        TO authenticated
                        USING (true);
                END IF;
            END $policy$;
        ', t_name, pol_name, pol_name, t_name);

        -- DELETE Policy
        pol_name := 'Allow authenticated users to delete ' || t_name;
        EXECUTE format('
            DO $policy$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE schemaname = ''public'' 
                    AND tablename = %L 
                    AND policyname = %L
                ) THEN
                    CREATE POLICY %I
                        ON public.%I FOR DELETE
                        TO authenticated
                        USING (true);
                END IF;
            END $policy$;
        ', t_name, pol_name, pol_name, t_name);
        
    END LOOP;
END $$;
