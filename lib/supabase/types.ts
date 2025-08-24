export interface Profile {
  id: string;
  org_id?: string;
  role: 'GENERATOR' | 'CONSUMER';
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  owner_id?: string;
  name: string;
  description?: string;
  tags: string[];
  json: unknown; // DSL JSON structure
  created_at: string;
  updated_at: string;
}