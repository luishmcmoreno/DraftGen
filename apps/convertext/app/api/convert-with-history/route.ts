import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@draft-gen/logger';
import { saveTextConversion } from '../../../src/lib/supabase/text-conversions';
import {
  createConversionStep,
  updateConversionStep,
} from '../../../src/lib/supabase/conversion-steps';
import { ConversionAgent } from '../../../src/lib/agent/conversion-agent';
import { getProviderFromName } from '../../../src/lib/providers';
import type { TextConversionResponse, ConversionResult } from '../../../src/types/conversion';

// This endpoint uses internal conversion tools with Supabase history tracking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      task_description,
      provider = 'mock',
      execution_id,
      step_number,
      example_output,
    } = body as {
      text: string;
      task_description: string;
      provider?: string;
      execution_id?: string;
      step_number?: number;
      example_output?: string;
    };

    if (!text || !task_description) {
      return NextResponse.json(
        { error: 'Text and task description are required' },
        { status: 400 }
      );
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
        logger.warn('Failed to create conversion step:', stepError);
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
        tool_args: result.tool_args.map((arg) => arg.name),
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
          logger.warn('Failed to update step with error:', updateError);
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
            ? conversionData.tool_args.map((arg) =>
                typeof arg === 'string' ? { name: arg, value: '' } : arg
              )
            : conversionData.tool_args,
          error: conversionData.error,
        };

        // Save to text conversions history
        await saveTextConversion(conversionResult, task_description, provider, stepId);

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
        logger.warn('Failed to save conversion history:', historyError);
        // Don't fail the request if history saving fails
      }

      return NextResponse.json(conversionData);
    } catch (conversionError) {
      logger.error('Conversion processing error:', conversionError);

      // Update step with error if we created one
      if (stepId) {
        try {
          await updateConversionStep(stepId, {
            status: 'error',
            error: conversionError instanceof Error ? conversionError.message : 'Conversion failed',
          });
        } catch (updateError) {
          logger.warn('Failed to update step with error:', updateError);
        }
      }

      return NextResponse.json(
        {
          error: 'Conversion failed',
          message:
            conversionError instanceof Error ? conversionError.message : 'Unknown conversion error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Conversion API Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
