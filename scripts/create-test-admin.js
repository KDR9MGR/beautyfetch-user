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

async function createTestAdmin() {
  try {
    console.log('🔧 Creating test admin user...');
    
    // Try to create a user with a realistic email
    const testEmail = 'testadmin@gmail.com';
    const testPassword = 'password123';
    
    console.log('1. Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'admin'
        }
      }
    });
    
    if (authError) {
      console.error('Auth Error:', authError);
      
      // If user already exists, try to sign in
      if (authError.message.includes('already registered')) {
        console.log('User already exists, trying to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        if (signInError) {
          console.error('Sign in error:', signInError);
          return;
        }
        
        console.log('✅ Signed in successfully!');
        console.log('User ID:', signInData.user?.id);
        
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user?.id)
          .single();
        
        if (existingProfile) {
          console.log('Profile already exists:', existingProfile);
          
          // Update role to admin if not already
          if (existingProfile.role !== 'admin') {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: 'admin' })
              .eq('id', signInData.user?.id);
            
            if (updateError) {
              console.error('Error updating role:', updateError);
            } else {
              console.log('✅ Updated user role to admin!');
            }
          }
        } else {
          console.log('No profile found, creating one...');
          // Try to create profile
          const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signInData.user?.id,
              email: testEmail,
              first_name: 'Test',
              last_name: 'Admin',
              role: 'admin',
              status: 'active'
            })
            .select()
            .single();
          
          if (profileError) {
            console.error('Profile creation error:', profileError);
          } else {
            console.log('✅ Profile created:', newProfile);
          }
        }
        
        return;
      }
      
      return;
    }
    
    console.log('✅ Auth user created:', authData.user?.id);
    
    // Create profile
    console.log('2. Creating profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user?.id,
        email: testEmail,
        first_name: 'Test',
        last_name: 'Admin',
        role: 'admin',
        status: 'active'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('Profile Error:', profileError);
      return;
    }
    
    console.log('✅ Profile created:', profile);
    console.log('\n🎉 Test admin user created successfully!');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('\n📝 You can now:');
    console.log('1. Go to the app preview');
    console.log('2. Click "Sign In"');
    console.log('3. Use the credentials above');
    console.log('4. You should see the admin dashboard button');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestAdmin();