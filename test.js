import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  // Activate ALL existing images
  const { data, error } = await supabase
    .from('app_images')
    .update({ is_active: true })
    .eq('is_active', false)
    .select();
  
  console.log('Activated', data?.length || 0, 'images');
  console.log('Error:', error);
  
  // Verify
  const { data: all } = await supabase.from('app_images').select('id, type, is_active, url').order('type');
  console.log('\nAll images after update:');
  all?.forEach(img => console.log(`  [${img.type}] active=${img.is_active} - ${img.url.substring(0, 60)}...`));
}
run();
