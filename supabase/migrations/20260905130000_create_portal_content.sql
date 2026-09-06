-- Create portal_content table
CREATE TABLE IF NOT EXISTS portal_content (
  key text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE portal_content ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users" 
ON portal_content FOR SELECT 
TO authenticated 
USING (true);

-- Allow insert/update access to hr, high command, and admin
CREATE POLICY "Allow write access to authorized roles" 
ON portal_content FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = auth.uid() 
    AND e.role IN ('hr', 'high command', 'admin')
  )
);

-- Setup update trigger for updated_at
CREATE OR REPLACE FUNCTION update_portal_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portal_content_timestamp_trigger
    BEFORE UPDATE ON portal_content
    FOR EACH ROW
    EXECUTE FUNCTION update_portal_content_timestamp();

-- Seed initial data for Pursuit Codes
INSERT INTO portal_content (key, data) VALUES (
  'sop_pursuit_codes',
  '[
    {"cond": "Code Green", "desc": "A Code Green situation is called when a civilian fails to pull over, and is showing no intents of yielding, you must follow this vehicle from a safe distance and wait for further situation development", "color": "#10b981"},
    {"cond": "Code Amber", "desc": "A Code Amber situation is called when the highest on a scene (Minimum Sr+) has deemed a vehicle dangerous enough to shoot tires, the back two tires are the only ones to be shot. Upon an emergency vehicle being stolen it is automatic Code Amber. Code Amber is able to called for two vehicle swaps. When a Third vehicle has been entered (including the original vehicle) then tyres can be shot. Also if they split in multiple vehicles you are allowed to pop tyres. If suspect switched to bike and no MEU is involved in the chase you are allowed to pop tyre.", "color": "#f59e0b"},
    {"cond": "Code Red", "desc": "A Code Red situation is called when all other methods of stopping the person have been exhausted. The civilian has taken part in mass killings or shootings. It can also be called if shots begin being exchanged from the vehicle(if the suspect opens fire upon an officer an officer can retain fire). This gives officers the ability to disable the person and their vehicle to prevent further harm to citizens (SGT+ call unless emergency situation)", "color": "#ef4444"}
  ]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Seed initial data for Response Codes
INSERT INTO portal_content (key, data) VALUES (
  'sop_response_codes',
  '[
    {"code": "Code 1", "desc": "Routine response. Non-emergency. Obey all traffic laws.", "color": "#3b82f6"},
    {"code": "Code 2", "desc": "Urgent response. Lights only. No sirens. Proceed with caution.", "color": "#eab308"},
    {"code": "Code 3", "desc": "Emergency response. Lights and sirens. Priority dispatch.", "color": "#ef4444"},
    {"code": "Code 4", "desc": "Situation resolved. No further units required.", "color": "#10b981"},
    {"code": "Code 5", "desc": "Felony traffic stop. High risk.", "color": "#f97316"},
    {"code": "Code 6", "desc": "Searching/Investigating. A search for certain individuals or vehicle/vehicles", "color": "#a855f7"}
  ]'::jsonb
) ON CONFLICT (key) DO NOTHING;
