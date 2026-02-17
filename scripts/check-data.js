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

async function checkData() {
  try {
    console.log('🔍 Checking database data...\n');
    
    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role')
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log('👥 PROFILES:');
    if (profilesError) {
      console.error('Error:', profilesError);
    } else {
      console.log(`Found ${profiles?.length || 0} profiles:`);
      profiles?.forEach(p => {
        console.log(`  - ${p.first_name} ${p.last_name} (${p.email}) - Role: ${p.role}`);
      });
    }
    
    console.log('\n📋 MERCHANT APPLICATIONS:');
    // Check merchant applications
    const { data: merchantApps, error: merchantError } = await supabase
      .from('merchant_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (merchantError) {
      console.error('Error:', merchantError);
    } else {
      console.log(`Found ${merchantApps?.length || 0} merchant applications:`);
      merchantApps?.forEach(app => {
        console.log(`  - ${app.business_name} (${app.email}) - Status: ${app.status} - Created: ${new Date(app.created_at).toLocaleDateString()}`);
      });
    }
    
    console.log('\n🚗 DRIVER APPLICATIONS:');
    // Check driver applications
    const { data: driverApps, error: driverError } = await supabase
      .from('driver_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (driverError) {
      console.error('Error:', driverError);
    } else {
      console.log(`Found ${driverApps?.length || 0} driver applications:`);
      driverApps?.forEach(app => {
        console.log(`  - ${app.first_name} ${app.last_name} (${app.email}) - Status: ${app.status} - Created: ${new Date(app.created_at).toLocaleDateString()}`);
      });
    }
    
    console.log('\n🏪 STORES:');
    // Check stores
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, owner_id, status')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (storesError) {
      console.error('Error:', storesError);
    } else {
      console.log(`Found ${stores?.length || 0} stores:`);
      stores?.forEach(store => {
        console.log(`  - ${store.name} (Owner: ${store.owner_id}) - Status: ${store.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData(); 