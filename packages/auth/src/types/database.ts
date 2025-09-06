/**
 * Database type definitions for authentication
 */

/**
 * Base database table interface
 */
export interface DatabaseTable {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database profile table
 */
export interface DatabaseProfile extends DatabaseTable {
  user_id: string;
  email?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Database user role table
 */
export interface DatabaseUserRole extends DatabaseTable {
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by?: string;
}

/**
 * Database role table
 */
export interface DatabaseRole extends DatabaseTable {
  name: string;
  description?: string;
  permissions: string[];
  is_system: boolean;
}

/**
 * Database permission table
 */
export interface DatabasePermission extends DatabaseTable {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

/**
 * Database session table
 */
export interface DatabaseSession extends DatabaseTable {
  user_id: string;
  token: string;
  refresh_token?: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}

/**
 * Database auth audit log
 */
export interface DatabaseAuthAudit extends DatabaseTable {
  user_id?: string;
  event_type: string;
  event_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
}

/**
 * Database provider account
 */
export interface DatabaseProviderAccount extends DatabaseTable {
  user_id: string;
  provider: string;
  provider_user_id: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

/**
 * Database types for Supabase
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: DatabaseProfile;
        Insert: Partial<DatabaseProfile> & Pick<DatabaseProfile, 'user_id'>;
        Update: Partial<DatabaseProfile>;
      };
      user_roles: {
        Row: DatabaseUserRole;
        Insert: Partial<DatabaseUserRole> & Pick<DatabaseUserRole, 'user_id' | 'role_id'>;
        Update: Partial<DatabaseUserRole>;
      };
      roles: {
        Row: DatabaseRole;
        Insert: Partial<DatabaseRole> & Pick<DatabaseRole, 'name'>;
        Update: Partial<DatabaseRole>;
      };
      permissions: {
        Row: DatabasePermission;
        Insert: Partial<DatabasePermission> & Pick<DatabasePermission, 'name' | 'resource' | 'action'>;
        Update: Partial<DatabasePermission>;
      };
      sessions: {
        Row: DatabaseSession;
        Insert: Partial<DatabaseSession> & Pick<DatabaseSession, 'user_id' | 'token' | 'expires_at'>;
        Update: Partial<DatabaseSession>;
      };
      auth_audit: {
        Row: DatabaseAuthAudit;
        Insert: Partial<DatabaseAuthAudit> & Pick<DatabaseAuthAudit, 'event_type' | 'success'>;
        Update: Partial<DatabaseAuthAudit>;
      };
      provider_accounts: {
        Row: DatabaseProviderAccount;
        Insert: Partial<DatabaseProviderAccount> & Pick<DatabaseProviderAccount, 'user_id' | 'provider' | 'provider_user_id'>;
        Update: Partial<DatabaseProviderAccount>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

/**
 * Helper type to extract table row types
 */
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

/**
 * Helper type to extract table insert types
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

/**
 * Helper type to extract table update types
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];