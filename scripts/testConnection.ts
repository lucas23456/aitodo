import { supabase } from '../lib/supabase';

/**
 * This script tests the connection to Supabase
 * Run with: npx ts-node scripts/testConnection.ts
 */
async function testConnection() {
  console.log('Testing Supabase connection...');

  try {
    // Test general connection
    const { data, error } = await supabase.from('_test').select('*').limit(1);

    if (error) {
      console.log('Connection test (expected error):', error.message);
      console.log('This error is normal if the _test table doesn\'t exist');
    } else {
      console.log('Connection successful!', data);
    }

    // Test auth service
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('Auth service error:', authError.message);
    } else {
      console.log('Auth service working!', authData.session ? 'Session exists' : 'No active session');
    }

    // Test Google OAuth configuration
    console.log('\nTesting Google OAuth configuration...');
    console.log('To test Google OAuth, you need to run the app and try signing in with Google.');
    console.log('Make sure you have configured the following in your Supabase project:');
    console.log('1. Google OAuth provider is enabled');
    console.log('2. Redirect URIs are properly set up:');
    console.log('   - https://aonlvdzdlmzzxaswikvc.supabase.co/auth/v1/callback');
    console.log('   - minimind://auth/callback');

    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testConnection()
    .then((success) => {
      if (success) {
        console.log('\nConnection test completed successfully!');
      } else {
        console.error('\nConnection test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Error running connection test:', error);
      process.exit(1);
    });
}

export default testConnection; 