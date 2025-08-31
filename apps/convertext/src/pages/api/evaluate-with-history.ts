import type { NextApiRequest, NextApiResponse } from 'next';
import type { ToolEvaluation } from '../../types/conversion';

// This endpoint integrates with the existing FastAPI backend for tool evaluation
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
      provider = 'mock' 
    } = req.body as {
      text: string;
      task_description: string;
      provider?: string;
    };

    if (!text || !task_description) {
      return res.status(400).json({ error: 'Text and task description are required' });
    }

    // Get the existing FastAPI backend URL from environment
    const backendUrl = process.env.CONVERTEXT_BACKEND_URL || 'http://localhost:8000';
    
    // Call the existing FastAPI backend
    const response = await fetch(`${backendUrl}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LLM-Provider': provider,
      },
      body: JSON.stringify({
        text,
        task_description,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        error: 'Backend evaluation failed',
        message: errorData.detail || `HTTP ${response.status}`,
      } as any);
    }

    const evaluationData: ToolEvaluation = await response.json();
    return res.status(200).json(evaluationData);

  } catch (error) {
    console.error('Evaluation API Error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as any);
  }
}