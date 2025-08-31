import type { NextApiRequest, NextApiResponse } from 'next';
import { getProviderFromName } from '../../lib/providers';
import { ConversionAgent } from '../../lib/agent/conversion-agent';
import type { ToolEvaluation } from '../../types/conversion';

// This endpoint uses internal conversion tools for task evaluation
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ToolEvaluation | { error: string; message?: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      text, 
      task_description, 
      example_output,
      provider = 'mock' 
    } = req.body as {
      text: string;
      task_description: string;
      example_output?: string;
      provider?: string;
    };

    if (!text || !task_description) {
      return res.status(400).json({ error: 'Text and task description are required' });
    }

    // Use internal conversion agent for evaluation
    const llmProvider = getProviderFromName(provider);
    const conversionAgent = new ConversionAgent(llmProvider);
    
    const evaluationData = await conversionAgent.evaluateTask(
      text,
      task_description,
      example_output
    );
    
    return res.status(200).json(evaluationData);

  } catch (error) {
    console.error('Evaluation API Error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as any);
  }
}