'use client';

import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@draft-gen/logger';

export default function TestAuth() {
  const { user, signIn, loading } = useAuth();

  const testSupabaseConnection = async () => {
    try {
      const supabase = createClient();
      logger.log('Supabase client created:', supabase);
      logger.log('Environment vars:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + '...',
      });
    } catch (error) {
      logger.error('Supabase connection test failed:', error);
    }
  };

  const testSignIn = async () => {
    try {
      logger.log('Testing sign in...');
      await signIn();
    } catch (error) {
      logger.error('Sign in test failed:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Auth Test Page</h1>

      <div className="space-y-4">
        <div>
          <strong>User:</strong> {user ? user.email : 'Not authenticated'}
        </div>

        <button
          onClick={testSupabaseConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
        >
          Test Supabase Connection
        </button>

        <button onClick={testSignIn} className="px-4 py-2 bg-green-500 text-white rounded">
          Test Sign In
        </button>
      </div>
    </div>
  );
}
