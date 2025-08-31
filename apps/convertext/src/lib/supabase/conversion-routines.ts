import { createClient } from './client';
import type { 
  Database, 
  ConversionRoutineStepTemplate,
  Json 
} from './database.types';
import type { SavedConversionRoutine, ConversionRoutineExecution, WorkflowStep } from '../../types/conversion';

type ConversionRoutineRow = Database['public']['Tables']['conversion_routines']['Row'];

type RoutineExecutionRow = Database['public']['Tables']['routine_executions']['Row'];
type RoutineExecutionInsert = Database['public']['Tables']['routine_executions']['Insert'];
type RoutineExecutionUpdate = Database['public']['Tables']['routine_executions']['Update'];

// Helper to convert database row to SavedConversionRoutine
function dbRowToSavedRoutine(row: ConversionRoutineRow): SavedConversionRoutine {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    steps: (row.steps as unknown) as ConversionRoutineStepTemplate[],
    createdAt: new Date(row.created_at),
    lastUsed: row.last_used ? new Date(row.last_used) : undefined,
    usageCount: row.usage_count,
  };
}

// Helper to convert database row to ConversionRoutineExecution
function dbRowToRoutineExecution(
  executionRow: RoutineExecutionRow,
  steps: WorkflowStep[] = []
): ConversionRoutineExecution {
  return {
    id: executionRow.id,
    name: executionRow.name,
    steps,
    currentStepIndex: executionRow.current_step_index,
    status: executionRow.status,
    provider: executionRow.provider,
    createdAt: new Date(executionRow.created_at),
    lastUpdated: new Date(executionRow.last_updated),
    savedRoutineId: executionRow.saved_routine_id || undefined,
  };
}

export async function saveConversionRoutine(routine: SavedConversionRoutine): Promise<SavedConversionRoutine> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User must be authenticated to save conversion routine');
  }

  // Check if routine already exists (for updates)
  const { data: existing } = await supabase
    .from('conversion_routines')
    .select('id')
    .eq('id', routine.id)
    .eq('owner_id', user.user.id)
    .single();

  let data, error;
  
  if (existing) {
    // Update existing routine
    ({ data, error } = await supabase
      .from('conversion_routines')
      .update({
        name: routine.name,
        description: routine.description || null,
        steps: routine.steps as unknown as Json,
        usage_count: routine.usageCount,
        last_used: routine.lastUsed?.toISOString() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', routine.id)
      .eq('owner_id', user.user.id)
      .select()
      .single());
  } else {
    // Insert new routine with provided ID
    ({ data, error } = await supabase
      .from('conversion_routines')
      .insert({
        id: routine.id,
        owner_id: user.user.id,
        name: routine.name,
        description: routine.description || null,
        steps: routine.steps as unknown as Json,
        usage_count: routine.usageCount,
        created_at: routine.createdAt.toISOString(),
        last_used: routine.lastUsed?.toISOString() || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single());
  }

  if (error) {
    throw new Error(`Failed to save conversion routine: ${error.message}`);
  }

  return dbRowToSavedRoutine(data);
}

export async function getStoredConversionRoutines(): Promise<SavedConversionRoutine[]> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return [];
  }

  const { data, error } = await supabase
    .from('conversion_routines')
    .select('*')
    .eq('owner_id', user.user.id)
    .order('last_used', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load conversion routines: ${error.message}`);
  }

  return (data || []).map(dbRowToSavedRoutine);
}

export async function deleteConversionRoutine(routineId: string): Promise<void> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User must be authenticated to delete conversion routine');
  }

  const { error } = await supabase
    .from('conversion_routines')
    .delete()
    .eq('id', routineId)
    .eq('owner_id', user.user.id);

  if (error) {
    throw new Error(`Failed to delete conversion routine: ${error.message}`);
  }
}

export async function updateConversionRoutineUsage(routineId: string): Promise<void> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User must be authenticated to update conversion routine usage');
  }

  const { error } = await supabase
    .from('conversion_routines')
    .update({
      last_used: new Date().toISOString(),
      usage_count: await incrementUsageCount(routineId),
      updated_at: new Date().toISOString(),
    })
    .eq('id', routineId)
    .eq('owner_id', user.user.id);

  if (error) {
    throw new Error(`Failed to update conversion routine usage: ${error.message}`);
  }
}

async function incrementUsageCount(routineId: string): Promise<number> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('conversion_routines')
    .select('usage_count')
    .eq('id', routineId)
    .single();

  return (data?.usage_count || 0) + 1;
}

export async function createRoutineExecution(execution: Omit<ConversionRoutineExecution, 'id' | 'createdAt' | 'lastUpdated'>): Promise<ConversionRoutineExecution> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User must be authenticated to create routine execution');
  }

  const executionData: RoutineExecutionInsert = {
    owner_id: user.user.id,
    name: execution.name,
    saved_routine_id: execution.savedRoutineId || null,
    current_step_index: execution.currentStepIndex,
    status: execution.status,
    provider: execution.provider,
  };

  const { data, error } = await supabase
    .from('routine_executions')
    .insert(executionData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create routine execution: ${error.message}`);
  }

  return dbRowToRoutineExecution(data, execution.steps);
}

export async function updateRoutineExecution(executionId: string, updates: Partial<ConversionRoutineExecution>): Promise<ConversionRoutineExecution> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User must be authenticated to update routine execution');
  }

  const updateData: RoutineExecutionUpdate = {
    last_updated: new Date().toISOString(),
  };

  if (updates.name) updateData.name = updates.name;
  if (updates.currentStepIndex !== undefined) updateData.current_step_index = updates.currentStepIndex;
  if (updates.status) updateData.status = updates.status;
  if (updates.provider) updateData.provider = updates.provider;

  const { data, error } = await supabase
    .from('routine_executions')
    .update(updateData)
    .eq('id', executionId)
    .eq('owner_id', user.user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update routine execution: ${error.message}`);
  }

  return dbRowToRoutineExecution(data, updates.steps || []);
}

export async function getRoutineExecution(executionId: string): Promise<ConversionRoutineExecution | null> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('routine_executions')
    .select('*')
    .eq('id', executionId)
    .eq('owner_id', user.user.id)
    .single();

  if (error || !data) {
    return null;
  }

  // TODO: Load conversion steps for this execution
  return dbRowToRoutineExecution(data);
}

export async function getUserRoutineExecutions(): Promise<ConversionRoutineExecution[]> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return [];
  }

  const { data, error } = await supabase
    .from('routine_executions')
    .select('*')
    .eq('owner_id', user.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load routine executions: ${error.message}`);
  }

  return (data || []).map(row => dbRowToRoutineExecution(row));
}