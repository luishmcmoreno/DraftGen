import { NextRequest, NextResponse } from 'next/server';
import { getProviderFromName } from '../../../src/lib/providers';
import { ConversionAgent } from '../../../src/lib/agent/conversion-agent';

// This endpoint uses internal conversion tools for task evaluation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      task_description,
      example_output,
      provider = 'mock',
    } = body as {
      text: string;
      task_description: string;
      example_output?: string;
      provider?: string;
    };

    if (!text || !task_description) {
      return NextResponse.json(
        { error: 'Text and task description are required' },
        { status: 400 }
      );
    }

    // Use internal conversion agent for evaluation
    const llmProvider = getProviderFromName(provider);
    const conversionAgent = new ConversionAgent(llmProvider);

    const evaluationData = await conversionAgent.evaluateTask(
      text,
      task_description,
      example_output
    );

    return NextResponse.json(evaluationData);
  } catch (error) {
    console.error('Evaluation API Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
