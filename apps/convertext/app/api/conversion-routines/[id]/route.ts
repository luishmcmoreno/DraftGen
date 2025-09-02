import { NextRequest, NextResponse } from 'next/server';
import {
  deleteConversionRoutine,
  updateConversionRoutineUsage,
  getRoutineExecution,
  updateRoutineExecution,
} from '../../../../src/lib/supabase/conversion-routines';
import type { ConversionRoutineExecution } from '../../../../src/types/conversion';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Get routine execution details
    const execution = await getRoutineExecution(id);
    return NextResponse.json({ execution });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Delete a conversion routine
    await deleteConversionRoutine(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, updates } = body as {
      action?: 'update_usage' | 'update_execution';
      updates?: Partial<ConversionRoutineExecution>;
    };

    if (action === 'update_usage') {
      // Update routine usage statistics
      await updateConversionRoutineUsage(id);
      return NextResponse.json({ success: true });
    }

    if (action === 'update_execution' && updates) {
      // Update routine execution
      const updatedExecution = await updateRoutineExecution(id, updates);
      return NextResponse.json({ execution: updatedExecution });
    }

    return NextResponse.json({ error: 'Invalid action or missing updates' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
