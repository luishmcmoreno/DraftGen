import type { NextApiRequest, NextApiResponse } from 'next';
import { TextTools } from '../../lib/text-tools';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signatures = TextTools.getToolSignatures();
    return res.status(200).json(signatures);
  } catch (error) {
    console.error('Tool signatures API Error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}