import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@draft-gen/logger';
import {
  getStoredConversionRoutines,
  saveConversionRoutine,
  createRoutineExecution,
} from '../../../src/lib/supabase/conversion-routines';
import type {
  SavedConversionRoutine,
  ConversionRoutineExecution,
} from '../../../src/types/conversion';

export async function GET() {
  try {
    // Get all saved conversion routines for the user
    const routines = await getStoredConversionRoutines();
    return NextResponse.json({ routines });
  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routine, execution } = body as {
      routine?: SavedConversionRoutine;
      execution?: Omit<ConversionRoutineExecution, 'id' | 'createdAt' | 'lastUpdated'>;
    };

    if (routine) {
      // Save a new conversion routine
      const savedRoutine = await saveConversionRoutine(routine);
      return NextResponse.json({ routine: savedRoutine }, { status: 201 });
    }

    if (execution) {
      // Create a new routine execution
      const newExecution = await createRoutineExecution(execution);
      return NextResponse.json({ execution: newExecution }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Either routine or execution must be provided' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
