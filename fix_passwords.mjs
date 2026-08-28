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
  
  const passFile = fs.readFileSync('passwords.txt', 'utf8');
  const existingNamesInFile = new Set();
  
  const lines = passFile.split('\n');
  for (const line of lines) {
    if (line.includes('[SUCCESS]')) {
      const match = line.match(/\[SUCCESS\]\s+(.*?)\s+->/);
      if (match && match[1]) {
        existingNamesInFile.add(match[1].trim());
      }
    }
  }

  const missingFromFile = employees.filter(e => !existingNamesInFile.has(e.name));
  
  console.log(`Total employees: ${employees.length}`);
  console.log(`Names in passwords.txt: ${existingNamesInFile.size}`);
  console.log(`Missing from passwords.txt: ${missingFromFile.length}`);
  
  if (missingFromFile.length > 0) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let added = 0;
    let passText = '';
    
    for (const emp of missingFromFile) {
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      password = 'A' + 'b' + '1' + '!' + password.substring(4);
      
      const firstName = emp.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      const cleanCallsign = (emp.callsign || emp.badge_number || '000').replace(/[^a-zA-Z0-9]/g, '');
      const username = `${firstName}.${cleanCallsign}`.toLowerCase();
      
      // Call the RPC we just updated to upsert the password
      const { error: updateError } = await supabase.rpc('admin_provision_officer', {
        p_officer_id: emp.id,
        p_username: username,
        p_password: password
      });
      
      if (!updateError) {
        passText += `\n[SUCCESS] ${emp.name} -> Username: ${username} | Temp Pass: ${password}`;
        added++;
      } else {
        console.error("Failed to update password for:", emp.name, updateError);
      }
    }
    
    if (passText) {
      fs.appendFileSync('passwords.txt', passText);
      console.log(`Successfully appended ${added} missing credentials to passwords.txt!`);
    }
  }
}

run();
