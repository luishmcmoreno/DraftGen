import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // Test database connection by attempting to get the current user
    // This will work even if not authenticated (returns null)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    // Test database connectivity with a simple query
    // This tests that we can connect to the database
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(0); // Don't actually fetch any data, just test connection
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "The result contains 0 rows" which is expected
      // if there's no data or RLS blocks access
      throw error;
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        supabase: 'connected',
        auth: userData ? 'authenticated' : 'anonymous',
        database: 'reachable'
      }
    }, { status: 200 });
    
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Health check failed:', error);
    }
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        supabase: 'error',
        auth: 'unknown',
        database: 'unreachable'
      }
    }, { status: 503 });
  }
}