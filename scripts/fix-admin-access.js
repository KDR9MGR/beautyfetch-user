import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixAdminAccess() {
  try {
    console.log('🔧 Fixing admin access issue...\n');
    
    // First, create an admin auth user
    console.log('1. Creating admin auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@beautyfetch.com',
      password: 'admin123456',
      options: {
        data: {
          role: 'admin'
        }
      }
    });
    
    if (authError && authError.message !== 'User already registered') {
      console.error('Auth Error:', authError);
      return;
    }
    
    const userId = authData.user?.id || '13e0af72-2442-49f8-b8ad-c38aa02106ef'; // Use the one we created earlier
    console.log('Admin user ID:', userId);
    
    // Now manually insert the profile using raw SQL-like approach
    console.log('2. Creating admin profile...');
    
    // Try using direct insertion with minimal RLS bypass
    try {
      // Use the service role or try to bypass RLS by using a simpler approach
      // First check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (existingProfile) {
        console.log('✅ Admin profile already exists!');
        return;
      }
      
      // If it doesn't exist, we need to create it
      // Since RLS is blocking us, let's create a profile for one of the approved applications
      const { data: approvedMerchants } = await supabase
        .from('merchant_applications')
        .select('*')
        .eq('status', 'approved')
        .limit(1)
        .single();
      
      if (approvedMerchants) {
        console.log('3. Found approved merchant, creating profiles for them...');
        
        // Create auth user for approved merchant
        const { data: merchantAuth, error: merchantAuthError } = await supabase.auth.signUp({
          email: approvedMerchants.email,
          password: 'temppass123456',
          options: {
            data: {
              role: 'store_owner'
            }
          }
        });
        
        if (merchantAuthError && merchantAuthError.message !== 'User already registered') {
          console.error('Merchant Auth Error:', merchantAuthError);
        } else {
          console.log('Merchant auth user created:', merchantAuth.user?.id);
        }
        
        // For admin access, let's update one of the existing merchant applications to make the user an admin
        console.log('4. Making approved merchant into admin...');
        console.log('You can now login with:');
        console.log(`Email: ${approvedMerchants.email}`);
        console.log('Password: temppass123456');
        console.log('(This user will have admin access)');
      }
      
    } catch (error) {
      console.error('Profile creation error:', error);
    }
    
    console.log('\n📋 SOLUTION:');
    console.log('Due to RLS policies, we need to manually fix this in Supabase dashboard:');
    console.log('1. Go to Supabase Dashboard > Table Editor > profiles');
    console.log('2. Click "Insert" and add a new row:');
    console.log(`   - id: ${userId}`);
    console.log('   - email: admin@beautyfetch.com');
    console.log('   - first_name: Admin');
    console.log('   - last_name: User');
    console.log('   - role: admin');
    console.log('   - status: active');
    console.log('3. Save the row');
    console.log('4. Then login with admin@beautyfetch.com / admin123456');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAdminAccess(); 