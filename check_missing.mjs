import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { data: employees } = await supabase.from('employees').select('id, name, badge_number, callsign');
  const { data: creds } = await supabase.from('auth_credentials').select('officer_id');
  
  const credIds = new Set(creds?.map(c => c.officer_id) || []);
  const missing = employees?.filter(e => !credIds.has(e.id)) || [];
  
  console.log(`Total employees: ${employees?.length}`);
  console.log(`Total credentials: ${creds?.length}`);
  console.log(`Missing credentials: ${missing.length}`);
  
  if (missing.length > 0) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let added = 0;
    
    let passText = '';
    
    for (const emp of missing) {
      // Helper to generate a complex password
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      password = 'A' + 'b' + '1' + '!' + password.substring(4);
      
      const firstName = emp.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      const cleanCallsign = (emp.callsign || emp.badge_number || '000').replace(/[^a-zA-Z0-9]/g, '');
      const username = `${firstName}.${cleanCallsign}`.toLowerCase();
      
      const { error } = await supabase.rpc('admin_provision_officer', {
        p_officer_id: emp.id,
        p_username: username,
        p_password: password
      });
      
      if (!error) {
        passText += `\n[SUCCESS] ${emp.name} -> Username: ${username} | Temp Pass: ${password}`;
        added++;
      } else {
        console.error("Failed to provision:", emp.name, error);
      }
    }
    
    if (passText) {
      fs.appendFileSync('passwords.txt', passText);
      console.log(`Successfully appended ${added} missing credentials to passwords.txt!`);
    }
  }
}

run();
