import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getStoredConversionRoutines, 
  saveConversionRoutine,
  createRoutineExecution 
} from '../../../lib/supabase/conversion-routines';
import type { SavedConversionRoutine, ConversionRoutineExecution } from '../../../types/conversion';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // Get all saved conversion routines for the user
      const routines = await getStoredConversionRoutines();
      return res.status(200).json({ routines });
    }

    if (req.method === 'POST') {
      const { routine, execution } = req.body as {
        routine?: SavedConversionRoutine;
        execution?: Omit<ConversionRoutineExecution, 'id' | 'createdAt' | 'lastUpdated'>;
      };

      if (routine) {
        // Save a new conversion routine
        const savedRoutine = await saveConversionRoutine(routine);
        return res.status(201).json({ routine: savedRoutine });
      }

      if (execution) {
        // Create a new routine execution
        const newExecution = await createRoutineExecution(execution);
        return res.status(201).json({ execution: newExecution });
      }

      return res.status(400).json({ error: 'Either routine or execution must be provided' });
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