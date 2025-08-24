export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          org_id: string | null
          role: 'GENERATOR' | 'CONSUMER'
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          org_id?: string | null
          role?: 'GENERATOR' | 'CONSUMER'
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          role?: 'GENERATOR' | 'CONSUMER'
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          owner_id: string | null
          name: string
          description: string | null
          tags: string[]
          json: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          name: string
          description?: string | null
          tags?: string[]
          json: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          name?: string
          description?: string | null
          tags?: string[]
          json?: Json
          created_at?: string
          updated_at?: string
        }
      }
      conversation_history: {
        Row: {
          id: string
          template_id: string | null
          user_id: string | null
          messages: ConversationMessage[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id?: string | null
          user_id?: string | null
          messages?: ConversationMessage[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string | null
          user_id?: string | null
          messages?: ConversationMessage[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'GENERATOR' | 'CONSUMER'
    }
  }
}