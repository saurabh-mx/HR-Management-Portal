import { createClient } from '@supabase/supabase-js';

// Setup basic client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jeqvjqubjpzrlikddvbh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BdiWq01NnrwxKB3CX_Q64Q_wKX3HS16';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function bootstrap() {
  console.log('Bootstrapping custom officer credential for testing...');
  
  // 1. Get an admin user from the employees table
  const { data: admins, error: fetchError } = await supabase
    .from('employees')
    .select('*')
    .limit(1);
    
  if (fetchError || !admins || admins.length === 0) {
    console.error('Could not find any employees:', fetchError);
    return;
  }
  
  const officer = admins[0];
  console.log(`Found officer: ${officer.name} (Callsign: ${officer.callsign || officer.badge_number || 'Unknown'})`);
  
  // 2. Generate a username based on our logic (simplified here)
  const firstName = officer.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  const cleanCallsign = (officer.callsign || officer.badge_number || '1A01').replace(/[^a-zA-Z0-9]/g, '');
  const username = `${firstName}.${cleanCallsign}`.toLowerCase();
  
  const authEmail = `${username}@hr-portal.internal`;
  const initialPassword = 'TempPassword123!';
  
  console.log(`Generated Username: ${username}`);
  console.log(`Initial Password: ${initialPassword}`);
  
  // 3. Register with Supabase Auth
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: authEmail,
    password: initialPassword,
    options: {
      data: {
        officer_id: officer.id,
        username: username,
      }
    }
  });
  
  if (signUpError) {
    console.error('Failed to register in Supabase Auth:', signUpError.message);
    if (!signUpError.message.includes('User already registered')) {
        return;
    }
  } else {
    console.log('Registered in Supabase Auth successfully.');
  }
  
  // 4. Create auth_credentials record
  const { error: credError } = await supabase.from('auth_credentials').insert({
    officer_id: officer.id,
    username: username,
    password_hash: '[managed-by-supabase-auth]',
    hash_algorithm: 'argon2id',
    account_state: 'pending_initial_login',
    is_first_login: true,
  });
  
  if (credError) {
    if (credError.code === '23505') {
        console.log('Credentials already exist in the database.');
    } else {
        console.error('Failed to create auth_credentials record:', credError);
        return;
    }
  } else {
    console.log('Created auth_credentials record successfully.');
  }
  
  console.log('\n--- SUCCESS ---');
  console.log('You can now test the Custom Officer Login with these credentials:');
  console.log(`Username: ${username}`);
  console.log(`Password: ${initialPassword}`);
  console.log('-----------------\n');
}

bootstrap();
