import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  deleteConversionRoutine,
  updateConversionRoutineUsage,
  getRoutineExecution,
  updateRoutineExecution
} from '../../../lib/supabase/conversion-routines';
import type { ConversionRoutineExecution } from '../../../types/conversion';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid routine ID' });
  }

  try {
    if (req.method === 'DELETE') {
      // Delete a conversion routine
      await deleteConversionRoutine(id);
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PUT') {
      const { action, updates } = req.body as {
        action?: 'update_usage' | 'update_execution';
        updates?: Partial<ConversionRoutineExecution>;
      };

      if (action === 'update_usage') {
        // Update routine usage statistics
        await updateConversionRoutineUsage(id);
        return res.status(200).json({ success: true });
      }

      if (action === 'update_execution' && updates) {
        // Update routine execution
        const updatedExecution = await updateRoutineExecution(id, updates);
        return res.status(200).json({ execution: updatedExecution });
      }

      return res.status(400).json({ error: 'Invalid action or missing updates' });
    }

    if (req.method === 'GET') {
      // Get routine execution details
      const execution = await getRoutineExecution(id);
      if (!execution) {
        return res.status(404).json({ error: 'Routine execution not found' });
      }
      return res.status(200).json({ execution });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}