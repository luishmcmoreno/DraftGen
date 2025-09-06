/**
 * Client-side authentication utilities
 * 
 * Re-exports browser client functions and types
 */

export { 
  createBrowserClient, 
  getBrowserClient 
} from '../clients/browser';

export type { SupabaseClient } from '@supabase/supabase-js';