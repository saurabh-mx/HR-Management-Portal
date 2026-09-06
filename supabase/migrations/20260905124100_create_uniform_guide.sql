-- Migration: Uniform Guide Table
-- Creates a table to store uniform details and policies, replacing static hardcoded JSON.

CREATE TABLE IF NOT EXISTS public.uniform_guide (
    id TEXT PRIMARY KEY, -- 'officer_deputy', 'sergeants_above', etc.
    title TEXT NOT NULL,
    male_uniform JSONB DEFAULT '[]'::jsonb,
    female_uniform JSONB DEFAULT '[]'::jsonb,
    rules JSONB DEFAULT '[]'::jsonb,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.uniform_guide ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all authenticated users" ON public.uniform_guide
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow all access for High Command, Admin, and HR" ON public.uniform_guide
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM employees 
        WHERE employees.id = auth.uid() 
        AND (lower(employees.role) IN ('hr', 'high command', 'admin') OR employees.is_admin = true)
      )
    );

-- Insert Default Data
INSERT INTO public.uniform_guide (id, title, male_uniform, female_uniform, rules, order_index)
VALUES 
(
  'officer_deputy', 
  'OFFICER / DEPUTY', 
  '[{"item": "Hat (optional)", "value": "10", "texture": "0"}, {"item": "Jackets", "value": "881", "texture": "3 (LSPD), 11 (BCSO)"}, {"item": "Shirts", "value": "285", "texture": "0"}, {"item": "Arms/Gloves", "value": "20", "texture": "0"}, {"item": "Pants", "value": "370", "texture": "4 (LSPD), 8 (BCSO)"}, {"item": "Shoes", "value": "25", "texture": "0"}, {"item": "Decals", "value": "248", "texture": "4 (LSPD), 0 (BCSO)"}, {"item": "Vest", "value": "105", "texture": "0 (LSPD), 1 (BCSO)"}, {"item": "Scarfs (Gun Holster)", "value": "210, 211, 216", "texture": ""}]'::jsonb,
  '[{"item": "Hat (optional)", "value": "10", "texture": "0"}, {"item": "Jackets", "value": "952", "texture": "3 (LSPD), 1 (BCSO)"}, {"item": "Shirts", "value": "388", "texture": "0"}, {"item": "Arms/Gloves", "value": "23", "texture": "0"}, {"item": "Pants", "value": "379", "texture": "4 (LSPD), 8 (BCSO)"}, {"item": "Shoes", "value": "25", "texture": "0"}, {"item": "Decals", "value": "342", "texture": "4 (LSPD), 0 (BCSO)"}, {"item": "Vest", "value": "128", "texture": "0 (LSPD), 1 (BCSO)"}, {"item": "Scarfs (Gun Holster)", "value": "212, 213, 211w", "texture": ""}]'::jsonb,
  '[]'::jsonb,
  1
),
(
  'officer_first_class', 
  'OFFICER / DEPUTY / RANGER FIRST CLASS', 
  '[{"item": "Hat (optional)", "value": "10", "texture": "0"}, {"item": "Jackets", "value": "881, 885", "texture": "2, 14 (LSPD), 12, 13 (BCSO)"}, {"item": "Shirts", "value": "285", "texture": "0"}, {"item": "Arms/Gloves", "value": "20", "texture": "0"}, {"item": "Pants", "value": "370", "texture": "4 (LSPD), 8 (BCSO)"}, {"item": "Shoes", "value": "25", "texture": "0"}, {"item": "Decals", "value": "248", "texture": "4 (LSPD), 0 (BCSO)"}, {"item": "Vest", "value": "85", "texture": "2 (LSPD), 0 (BCSO)"}, {"item": "Scarfs (Gun Holster)", "value": "210, 211, 216", "texture": ""}]'::jsonb,
  '[{"item": "Hat (optional)", "value": "10", "texture": "0"}, {"item": "Jackets", "value": "952, 955", "texture": "3, 2 (LSPD), 1, 18 (BCSO)"}, {"item": "Shirts", "value": "388", "texture": "0"}, {"item": "Arms/Gloves", "value": "23", "texture": "0"}, {"item": "Pants", "value": "379", "texture": "4 (LSPD), 8 (BCSO)"}, {"item": "Shoes", "value": "25", "texture": "0"}, {"item": "Decals", "value": "342", "texture": "4 (LSPD), 0 (BCSO)"}, {"item": "Vest", "value": "111", "texture": "2 (LSPD), 0 (BCSO)"}, {"item": "Scarfs (Gun Holster)", "value": "212, 213, 211w", "texture": ""}]'::jsonb,
  '[]'::jsonb,
  2
),
(
  'senior_officer', 
  'SENIOR OFFICER / DEPUTY / RANGER', 
  '[{"item": "Hat (optional)", "value": "10", "texture": "0"}, {"item": "Jackets", "value": "881, 885, 882", "texture": "2, 14, 19 (LSPD), 12, 13, 1 (BCSO)"}, {"item": "Shirts", "value": "285", "texture": "0, 1"}, {"item": "Arms/Gloves", "value": "26", "texture": "0"}, {"item": "Pants", "value": "370", "texture": "5"}, {"item": "Shoes", "value": "25", "texture": "0"}, {"item": "Decals", "value": "249", "texture": "5 (LSPD), 1 (BCSO)"}, {"item": "Vest", "value": "88, 89, 91, 88", "texture": "Acc. to Dept."}, {"item": "Scarfs (Gun Holster)", "value": "214, 215, 216", "texture": ""}]'::jsonb,
  '[{"item": "Hat (optional)", "value": "10", "texture": "0"}, {"item": "Jackets", "value": "952, 955, 953", "texture": "3, 2 (LSPD), 1, 18 (BCSO)"}, {"item": "Shirts", "value": "388", "texture": "0, 1"}, {"item": "Arms/Gloves", "value": "23, 24", "texture": "0"}, {"item": "Pants", "value": "379", "texture": "5"}, {"item": "Shoes", "value": "25", "texture": "0"}, {"item": "Decals", "value": "342", "texture": "5 (LSPD), 1 (BCSO)"}, {"item": "Vest", "value": "129, 127", "texture": "1 (LSPD), 0 (BCSO)"}, {"item": "Scarfs (Gun Holster)", "value": "212, 213, 211", "texture": ""}]'::jsonb,
  '[]'::jsonb,
  3
),
(
  'corporal', 
  'CORPORAL', 
  '[{"item": "Hat (optional)", "value": "10", "texture": "0"}, {"item": "Jackets", "value": "881, 885, 882, 886", "texture": "2, 14, 19, 0 (LSPD), 12, 13, 1, 5 (BCSO)"}, {"item": "Shirts", "value": "285, 276", "texture": "0, 1"}, {"item": "Arms/Gloves", "value": "26, 20", "texture": "0"}, {"item": "Pants", "value": "370, 372", "texture": "5, 4"}, {"item": "Shoes", "value": "25", "texture": "0"}, {"item": "Decals", "value": "249", "texture": "6 (LSPD), 2 (BCSO)"}, {"item": "Vest", "value": "Any PD Vest", "texture": "Acc. to Dept."}, {"item": "Scarfs (Gun Holster)", "value": "214, 215, 216", "texture": ""}]'::jsonb,
  '[{"item": "Hat (optional)", "value": "10", "texture": "0"}, {"item": "Jackets", "value": "952, 955, 953, 957", "texture": "3, 2, 0 (LSPD), 1, 18 (BCSO)"}, {"item": "Shirts", "value": "388, 387", "texture": "0, 1"}, {"item": "Arms/Gloves", "value": "23, 24", "texture": "0"}, {"item": "Pants", "value": "382, 381", "texture": "5"}, {"item": "Shoes", "value": "25", "texture": "0"}, {"item": "Decals", "value": "342", "texture": "6 (LSPD), 1 (BCSO)"}, {"item": "Vest", "value": "Any PD Vest", "texture": "Acc. to Dept."}, {"item": "Scarfs (Gun Holster)", "value": "212, 213, 211", "texture": ""}]'::jsonb,
  '[]'::jsonb,
  4
),
(
  'sergeants_above',
  'SERGEANTS & ABOVE',
  '[]'::jsonb,
  '[]'::jsonb,
  '[
    {"type": "main_rule", "title": "Formal Uniform Policy", "content": "They can wear any formal uniform (Non-decal Shirts and Casual Shirts are not allowed) as per their respective departments."},
    {"type": "mandatory_equipment", "title": "Mandatory Equipment", "content": "Make sure to add a utility belt (Taser must be visible), gun holster and police vest Till Sergeant First Class.", "note": "• Shoulder holster and Fitted/Narrow Pants are allowed to Sergeant First Class & above."},
    {"type": "bullet_rule", "title": "Major & Above", "content": "Allowed to wear Formal Uniform (Professional).", "color": "#10b981"},
    {"type": "bullet_rule", "title": "Combat Outfits", "content": "Allowed from the Corporal Above Rank.", "color": "#f59e0b"}
  ]'::jsonb,
  5
)
ON CONFLICT (id) DO NOTHING;
