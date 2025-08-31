export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface ConversionRoutineStepTemplate {
  id: string;
  stepNumber: number;
  taskDescription: string;
  exampleOutput?: string;
}

export interface ConversionResult {
  original_text: string;
  converted_text: string;
  diff: string;
  tool_used: string;
  confidence: number;
  render_mode: 'diff' | 'output';
  tool_args?: { name: string; value: string }[];
  error?: string;
}

export interface ToolEvaluation {
  reasoning: string;
  tool: string;
  tool_args: { name: string; value: string }[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          role: 'GENERATOR' | 'CONSUMER';
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          role?: 'GENERATOR' | 'CONSUMER';
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          role?: 'GENERATOR' | 'CONSUMER';
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversion_routines: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          description: string | null;
          steps: Json; // ConversionRoutineStepTemplate[]
          usage_count: number;
          created_at: string;
          last_used: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          description?: string | null;
          steps: Json;
          usage_count?: number;
          created_at?: string;
          last_used?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          name?: string;
          description?: string | null;
          steps?: Json;
          usage_count?: number;
          created_at?: string;
          last_used?: string | null;
          updated_at?: string;
        };
      };
      routine_executions: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          saved_routine_id: string | null;
          current_step_index: number;
          status: 'idle' | 'running' | 'completed' | 'error';
          provider: string;
          created_at: string;
          last_updated: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          saved_routine_id?: string | null;
          current_step_index?: number;
          status?: 'idle' | 'running' | 'completed' | 'error';
          provider: string;
          created_at?: string;
          last_updated?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          name?: string;
          saved_routine_id?: string | null;
          current_step_index?: number;
          status?: 'idle' | 'running' | 'completed' | 'error';
          provider?: string;
          created_at?: string;
          last_updated?: string;
        };
      };
      conversion_steps: {
        Row: {
          id: string;
          execution_id: string;
          step_number: number;
          status: 'pending' | 'running' | 'completed' | 'error' | 'skipped' | 'editing';
          input_data: Json; // { text: string; taskDescription: string; exampleOutput?: string }
          output_data: Json | null; // { result: ConversionResult; evaluation?: ToolEvaluation }
          error_message: string | null;
          duration_ms: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          execution_id: string;
          step_number: number;
          status?: 'pending' | 'running' | 'completed' | 'error' | 'skipped' | 'editing';
          input_data: Json;
          output_data?: Json | null;
          error_message?: string | null;
          duration_ms?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          execution_id?: string;
          step_number?: number;
          status?: 'pending' | 'running' | 'completed' | 'error' | 'skipped' | 'editing';
          input_data?: Json;
          output_data?: Json | null;
          error_message?: string | null;
          duration_ms?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      text_conversions: {
        Row: {
          id: string;
          owner_id: string | null;
          step_id: string | null;
          original_text: string;
          converted_text: string | null;
          task_description: string;
          tool_used: string | null;
          tool_args: Json | null;
          confidence: number | null;
          diff_result: string | null;
          render_mode: 'diff' | 'output' | null;
          provider: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          step_id?: string | null;
          original_text: string;
          converted_text?: string | null;
          task_description: string;
          tool_used?: string | null;
          tool_args?: Json | null;
          confidence?: number | null;
          diff_result?: string | null;
          render_mode?: 'diff' | 'output' | null;
          provider: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          step_id?: string | null;
          original_text?: string;
          converted_text?: string | null;
          task_description?: string;
          tool_used?: string | null;
          tool_args?: Json | null;
          confidence?: number | null;
          diff_result?: string | null;
          render_mode?: 'diff' | 'output' | null;
          provider?: string;
          error_message?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'GENERATOR' | 'CONSUMER';
      routine_status: 'idle' | 'running' | 'completed' | 'error';
      step_status: 'pending' | 'running' | 'completed' | 'error' | 'skipped' | 'editing';
      render_mode: 'diff' | 'output';
    };
  };
}