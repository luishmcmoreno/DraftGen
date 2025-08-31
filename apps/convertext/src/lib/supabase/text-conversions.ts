import { createClient } from './client';
import type { Database } from './database.types';
import type { ConversionResult } from '../../types/conversion';

type TextConversionRow = Database['public']['Tables']['text_conversions']['Row'];
type TextConversionInsert = Database['public']['Tables']['text_conversions']['Insert'];

// Helper to convert database row to ConversionResult with metadata
export interface ConversionHistoryEntry extends ConversionResult {
  id: string;
  stepId?: string;
  taskDescription: string;
  provider: string;
  createdAt: Date;
}

function dbRowToConversionHistory(row: TextConversionRow): ConversionHistoryEntry {
  return {
    id: row.id,
    stepId: row.step_id || undefined,
    original_text: row.original_text,
    converted_text: row.converted_text || '',
    diff: row.diff_result || '',
    tool_used: row.tool_used || '',
    confidence: row.confidence || 0,
    render_mode: (row.render_mode as 'diff' | 'output') || 'diff',
    tool_args: (row.tool_args as { name: string; value: string }[]) || undefined,
    error: row.error_message || undefined,
    taskDescription: row.task_description,
    provider: row.provider,
    createdAt: new Date(row.created_at),
  };
}

export async function saveTextConversion(
  conversion: ConversionResult,
  taskDescription: string,
  provider: string,
  stepId?: string
): Promise<ConversionHistoryEntry> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User must be authenticated to save text conversion');
  }

  const conversionData: TextConversionInsert = {
    owner_id: user.user.id,
    step_id: stepId || null,
    original_text: conversion.original_text,
    converted_text: conversion.converted_text,
    task_description: taskDescription,
    tool_used: conversion.tool_used,
    tool_args: conversion.tool_args || null,
    confidence: conversion.confidence,
    diff_result: conversion.diff,
    render_mode: conversion.render_mode,
    provider,
    error_message: conversion.error || null,
  };

  const { data, error } = await supabase
    .from('text_conversions')
    .insert(conversionData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save text conversion: ${error.message}`);
  }

  return dbRowToConversionHistory(data);
}

export async function getConversionHistory(limit = 50): Promise<ConversionHistoryEntry[]> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return [];
  }

  const { data, error } = await supabase
    .from('text_conversions')
    .select('*')
    .eq('owner_id', user.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load conversion history: ${error.message}`);
  }

  return (data || []).map(dbRowToConversionHistory);
}

export async function getConversionHistoryByStep(stepId: string): Promise<ConversionHistoryEntry[]> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return [];
  }

  const { data, error } = await supabase
    .from('text_conversions')
    .select('*')
    .eq('owner_id', user.user.id)
    .eq('step_id', stepId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load conversion history for step: ${error.message}`);
  }

  return (data || []).map(dbRowToConversionHistory);
}

export async function searchConversionHistory(
  query: string,
  limit = 20
): Promise<ConversionHistoryEntry[]> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return [];
  }

  const { data, error } = await supabase
    .from('text_conversions')
    .select('*')
    .eq('owner_id', user.user.id)
    .or(`original_text.ilike.%${query}%,converted_text.ilike.%${query}%,task_description.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search conversion history: ${error.message}`);
  }

  return (data || []).map(dbRowToConversionHistory);
}

export async function deleteTextConversion(conversionId: string): Promise<void> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User must be authenticated to delete text conversion');
  }

  const { error } = await supabase
    .from('text_conversions')
    .delete()
    .eq('id', conversionId)
    .eq('owner_id', user.user.id);

  if (error) {
    throw new Error(`Failed to delete text conversion: ${error.message}`);
  }
}

export async function getConversionStatsByTool(): Promise<{ tool: string; count: number }[]> {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return [];
  }

  const { data, error } = await supabase
    .from('text_conversions')
    .select('tool_used')
    .eq('owner_id', user.user.id)
    .not('tool_used', 'is', null);

  if (error) {
    return [];
  }

  // Count tools usage
  const toolCounts = (data || []).reduce((acc, item) => {
    const tool = item.tool_used as string;
    acc[tool] = (acc[tool] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(toolCounts)
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count);
}