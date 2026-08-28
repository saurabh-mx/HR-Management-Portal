import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jeqvjqubjpzrlikddvbh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BdiWq01NnrwxKB3CX_Q64Q_wKX3HS16';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function generateRandomPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure one uppercase, one lowercase, one digit, one special
  password = 'A' + 'b' + '1' + '!' + password.substring(4);
  return password;
}

async function bootstrapAll() {
  console.log('Bootstrapping all officers using RPC bypass...');
  
  // 1. Fetch all employees
  const { data: employees, error: fetchError } = await supabase.from('employees').select('*');
  
  if (fetchError || !employees) {
    console.error('Error fetching employees:', fetchError);
    return;
  }
  
  console.log(`Found ${employees.length} employees.`);
  
  // 2. Fetch existing credentials to avoid duplicates
  const { data: existingCreds, error: credsError } = await supabase.from('auth_credentials').select('officer_id');
  
  if (credsError) {
    console.error('Error fetching existing credentials:', credsError);
    return;
  }
  
  const existingSet = new Set(existingCreds.map(c => c.officer_id));
  
  // 3. Filter employees that need credentials
  const needsCredentials = employees.filter(emp => !existingSet.has(emp.id));
  
  console.log(`${needsCredentials.length} employees need credentials.`);
  
  let successCount = 0;
  let lines = [];
  
  for (const officer of needsCredentials) {
    try {
      const firstName = officer.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      const cleanCallsign = (officer.callsign || officer.badge_number || '000').replace(/[^a-zA-Z0-9]/g, '');
      const username = `${firstName}.${cleanCallsign}`.toLowerCase();
      
      const tempPassword = generateRandomPassword();
      
      const { error: rpcError } = await supabase.rpc('admin_provision_officer', {
        p_officer_id: officer.id,
        p_username: username,
        p_password: tempPassword
      });
      
      if (rpcError) {
        console.error(`Error provisioning ${officer.name}:`, rpcError.message);
        continue;
      }
      
      const line = `[SUCCESS] ${officer.name} -> Username: ${username} | Temp Pass: ${tempPassword}`;
      console.log(line);
      lines.push(line);
      successCount++;
      
    } catch (err) {
      console.error(`Exception processing ${officer.name}:`, err);
    }
  }
  
  console.log(`\nBootstrapping complete! ${successCount} new officers onboarded via RPC.`);
  
  if (lines.length > 0) {
     fs.writeFileSync('passwords.txt', lines.join('\n'));
     console.log('Saved generated credentials to passwords.txt');
  }
}

bootstrapAll();
