import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ysmzgrtfxbtqkaeltoug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbXpncnRmeGJ0cWthZWx0b3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTQzMzcsImV4cCI6MjA2Mjk3MDMzN30.C6WxgdAj3g7fk1IsQRufUhckn-n_eOta_8vR_PVY0d8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAndCreateAdmin() {
  try {
    console.log('Checking for existing admin users...');
    
    // Check for existing admin users
    const { data: adminUsers, error: checkError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role')
      .eq('role', 'admin');
    
    if (checkError) {
      console.error('Error checking admin users:', checkError);
      return;
    }
    
    console.log(`Found ${adminUsers?.length || 0} admin users:`, adminUsers);
    
    if (!adminUsers || adminUsers.length === 0) {
      console.log('❌ No admin users found in database.');
      console.log('\n📋 SOLUTION:');
      console.log('You need to manually create an admin user. Here are the options:');
      console.log('\n1. Use Supabase Dashboard:');
      console.log('   - Go to Authentication > Users');
      console.log('   - Create a new user with any valid email');
      console.log('   - Then go to Table Editor > profiles');
      console.log('   - Insert a new row with the user ID and role="admin"');
      console.log('\n2. Or promote an existing user to admin (see below)');
    } else {
      console.log('✅ Admin users already exist');
      adminUsers.forEach(admin => {
        console.log(`- ${admin.first_name} ${admin.last_name} (${admin.email})`);
      });
    }
    
    // Check for recent applications
    console.log('\nChecking for recent applications...');
    
    const { data: merchantApps } = await supabase
      .from('merchant_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    const { data: driverApps } = await supabase
      .from('driver_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log(`Recent merchant applications: ${merchantApps?.length || 0}`);
    console.log(`Recent driver applications: ${driverApps?.length || 0}`);
    
    if (merchantApps) {
      merchantApps.forEach(app => {
        console.log(`- Merchant: ${app.business_name} (${app.email}) - Status: ${app.status}`);
      });
    }
    
    if (driverApps) {
      driverApps.forEach(app => {
        console.log(`- Driver: ${app.first_name} ${app.last_name} (${app.email}) - Status: ${app.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndCreateAdmin();
