import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('app_settings').select('*');
  console.log('app_settings error:', error?.message);

  const { data: d2, error: e2 } = await supabase.from('soi_settings').select('*');
  console.log('soi_settings error:', e2?.message);
}

checkSchema();
