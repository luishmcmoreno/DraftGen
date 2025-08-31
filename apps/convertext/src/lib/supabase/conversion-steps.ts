import { createClient } from './client';
import type { Database, Json } from './database.types';
import type { WorkflowStep, ConversionResult, ToolEvaluation } from '../../types/conversion';

type ConversionStepRow = Database['public']['Tables']['conversion_steps']['Row'];
type ConversionStepInsert = Database['public']['Tables']['conversion_steps']['Insert'];
type ConversionStepUpdate = Database['public']['Tables']['conversion_steps']['Update'];

// Helper to convert database row to WorkflowStep
function dbRowToWorkflowStep(row: ConversionStepRow): WorkflowStep {
  const inputData = row.input_data as { text: string; taskDescription: string; exampleOutput?: string };
  const outputData = row.output_data as { result: ConversionResult; evaluation?: ToolEvaluation } | null;
  
  return {
    id: row.id,
    stepNumber: row.step_number,
    status: row.status,
    input: inputData,
    output: outputData || undefined,
    error: row.error_message || undefined,
    timestamp: new Date(row.created_at),
    duration: row.duration_ms || undefined,
  };
}

// Helper to convert WorkflowStep to database insert
function workflowStepToDbInsert(
  executionId: string,
  step: Omit<WorkflowStep, 'id' | 'timestamp'>
): ConversionStepInsert {
  return {
    execution_id: executionId,
    step_number: step.stepNumber,
    status: step.status,
    input_data: step.input as unknown as Json,
    output_data: (step.output as unknown as Json) || null,
    error_message: step.error || null,
    duration_ms: step.duration || null,
  };
}

export async function createConversionStep(
  executionId: string,
  step: Omit<WorkflowStep, 'id' | 'timestamp'>
): Promise<WorkflowStep> {
  const supabase = createClient();
  
  const stepData = workflowStepToDbInsert(executionId, step);

  const { data, error } = await supabase
    .from('conversion_steps')
    .insert(stepData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversion step: ${error.message}`);
  }

  return dbRowToWorkflowStep(data);
}

export async function updateConversionStep(
  stepId: string,
  updates: {
    status?: WorkflowStep['status'];
    output?: WorkflowStep['output'];
    error?: string;
    duration?: number;
  }
): Promise<WorkflowStep> {
  const supabase = createClient();
  
  const updateData: ConversionStepUpdate = {
    completed_at: ['completed', 'error', 'skipped'].includes(updates.status || '') 
      ? new Date().toISOString() 
      : undefined,
  };

  if (updates.status) updateData.status = updates.status;
  if (updates.output) updateData.output_data = updates.output as unknown as Json;
  if (updates.error) updateData.error_message = updates.error;
  if (updates.duration) updateData.duration_ms = updates.duration;

  const { data, error } = await supabase
    .from('conversion_steps')
    .update(updateData)
    .eq('id', stepId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update conversion step: ${error.message}`);
  }

  return dbRowToWorkflowStep(data);
}

export async function getConversionStepsByExecution(executionId: string): Promise<WorkflowStep[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('conversion_steps')
    .select('*')
    .eq('execution_id', executionId)
    .order('step_number', { ascending: true });

  if (error) {
    throw new Error(`Failed to load conversion steps: ${error.message}`);
  }

  return (data || []).map(dbRowToWorkflowStep);
}

export async function getConversionStep(stepId: string): Promise<WorkflowStep | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('conversion_steps')
    .select('*')
    .eq('id', stepId)
    .single();

  if (error || !data) {
    return null;
  }

  return dbRowToWorkflowStep(data);
}

export async function deleteConversionStep(stepId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('conversion_steps')
    .delete()
    .eq('id', stepId);

  if (error) {
    throw new Error(`Failed to delete conversion step: ${error.message}`);
  }
}