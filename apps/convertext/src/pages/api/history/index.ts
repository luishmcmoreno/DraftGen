import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getConversionHistory, 
  searchConversionHistory,
  getConversionStatsByTool 
} from '../../../lib/supabase/text-conversions';
import { getUserRoutineExecutions } from '../../../lib/supabase/conversion-routines';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const { 
        type = 'conversions', 
        limit = '50', 
        search 
      } = req.query as {
        type?: 'conversions' | 'executions' | 'stats';
        limit?: string;
        search?: string;
      };

      const limitNum = parseInt(limit, 10);

      if (type === 'conversions') {
        if (search && typeof search === 'string') {
          // Search conversion history
          const history = await searchConversionHistory(search, limitNum);
          return res.status(200).json({ history });
        } else {
          // Get recent conversion history
          const history = await getConversionHistory(limitNum);
          return res.status(200).json({ history });
        }
      }

      if (type === 'executions') {
        // Get routine execution history
        const executions = await getUserRoutineExecutions();
        return res.status(200).json({ executions });
      }

      if (type === 'stats') {
        // Get conversion statistics
        const stats = await getConversionStatsByTool();
        return res.status(200).json({ stats });
      }

      return res.status(400).json({ error: 'Invalid type parameter' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('History API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}