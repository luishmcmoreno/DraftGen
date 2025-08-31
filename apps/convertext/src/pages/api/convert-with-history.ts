import type { NextApiRequest, NextApiResponse } from 'next';
import { saveTextConversion } from '../../lib/supabase/text-conversions';
import { 
  createConversionStep, 
  updateConversionStep 
} from '../../lib/supabase/conversion-steps';
import { ConversionAgent } from '../../lib/agent/conversion-agent';
import { getProviderFromName } from '../../lib/providers';
import type { 
  TextConversionResponse, 
  ConversionResult, 
  WorkflowStep 
} from '../../types/conversion';

// This endpoint uses internal conversion tools with Supabase history tracking
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TextConversionResponse | { error: string; message?: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      text, 
      task_description, 
      provider = 'mock',
      execution_id,
      step_number,
      example_output 
    } = req.body as {
      text: string;
      task_description: string;
      provider?: string;
      execution_id?: string;
      step_number?: number;
      example_output?: string;
    };

    if (!text || !task_description) {
      return res.status(400).json({ error: 'Text and task description are required' });
    }

    let stepId: string | undefined;

    // Create conversion step if execution_id is provided
    if (execution_id && step_number !== undefined) {
      try {
        const step = await createConversionStep(execution_id, {
          stepNumber: step_number,
          status: 'running',
          input: {
            text,
            taskDescription: task_description,
            exampleOutput: example_output,
          },
        });
        stepId = step.id;
      } catch (stepError) {
        console.warn('Failed to create conversion step:', stepError);
        // Continue without step tracking
      }
    }

    // Use internal conversion agent instead of external FastAPI backend
    try {
      const llmProvider = getProviderFromName(provider);
      const conversionAgent = new ConversionAgent(llmProvider);
      
      const result = await conversionAgent.processRequest({
        text,
        taskDescription: task_description,
        exampleOutput: example_output,
      });

      const conversionData: TextConversionResponse = {
        original_text: result.original_text,
        converted_text: result.converted_text,
        diff: result.diff,
        tool_used: result.tool_used,
        confidence: result.confidence,
        render_mode: result.render_mode,
        tool_args: result.tool_args,
        error: result.error,
      };

      // If there was an error in conversion, update step and continue
      if (conversionData.error && stepId) {
        try {
          await updateConversionStep(stepId, {
            status: 'error',
            error: conversionData.error,
          });
        } catch (updateError) {
          console.warn('Failed to update step with error:', updateError);
        }
      }

      // Save to Supabase history
      try {
      const conversionResult: ConversionResult = {
        original_text: conversionData.original_text,
        converted_text: conversionData.converted_text,
        diff: conversionData.diff,
        tool_used: conversionData.tool_used,
        confidence: conversionData.confidence,
        render_mode: conversionData.render_mode,
        tool_args: Array.isArray(conversionData.tool_args) 
          ? conversionData.tool_args.map(arg => 
              typeof arg === 'string' ? { name: arg, value: '' } : arg
            )
          : conversionData.tool_args,
        error: conversionData.error,
      };

      // Save to text conversions history
      await saveTextConversion(
        conversionResult,
        task_description,
        provider,
        stepId
      );

      // Update conversion step if we created one
      if (stepId) {
        await updateConversionStep(stepId, {
          status: conversionData.error ? 'error' : 'completed',
          output: {
            result: conversionResult,
          },
          error: conversionData.error,
        });
      }

    } catch (historyError) {
      console.warn('Failed to save conversion history:', historyError);
      // Don't fail the request if history saving fails
    }

      return res.status(200).json(conversionData);

    } catch (conversionError) {
      console.error('Conversion processing error:', conversionError);
      
      // Update step with error if we created one
      if (stepId) {
        try {
          await updateConversionStep(stepId, {
            status: 'error',
            error: conversionError instanceof Error ? conversionError.message : 'Conversion failed',
          });
        } catch (updateError) {
          console.warn('Failed to update step with error:', updateError);
        }
      }
      
      return res.status(500).json({ 
        error: 'Conversion failed',
        message: conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'
      } as any);
    }

  } catch (error) {
    console.error('Conversion API Error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as any);
  }
}