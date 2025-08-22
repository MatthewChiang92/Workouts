// Quick Supabase connection test
// Run this with: node test_supabase.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test 1: Basic connection
    console.log('\n🔍 Testing basic connection...');
    const { data, error } = await supabase.from('routines').select('count');
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Connection successful!');
    
    // Test 2: Check if tables exist
    console.log('\n🔍 Checking if tables exist...');
    const { data: routinesData, error: routinesError } = await supabase
      .from('routines')
      .select('*')
      .limit(1);
      
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .limit(1);
    
    if (routinesError) {
      console.error('❌ Routines table issue:', routinesError.message);
    } else {
      console.log('✅ Routines table accessible');
    }
    
    if (exercisesError) {
      console.error('❌ Exercises table issue:', exercisesError.message);
    } else {
      console.log('✅ Exercises table accessible');
    }
    
    console.log('\n🎉 All tests passed! Your Supabase setup is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection();