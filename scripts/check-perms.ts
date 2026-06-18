import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
);

async function check() {
  const { data: roles } = await supabase.from('user_roles').select('*').eq('role', 'user');
  if (!roles || roles.length === 0) {
    console.log('No users found');
    return;
  }
  
  const { data: perms } = await supabase.from('user_page_permissions').select('*').eq('user_id', roles[0].user_id);
  console.log('User Role:', roles[0]);
  console.log('Perms:', perms);
}
check();
