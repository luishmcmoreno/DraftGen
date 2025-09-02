import { NextRequest, NextResponse } from 'next/server';
import {
  getConversionHistory,
  searchConversionHistory,
  getConversionStatsByTool,
} from '../../../src/lib/supabase/text-conversions';
import { getUserRoutineExecutions } from '../../../src/lib/supabase/conversion-routines';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'conversions';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search');

    if (type === 'conversions') {
      if (search) {
        // Search conversion history
        const history = await searchConversionHistory(search, limit);
        return NextResponse.json({ history });
      } else {
        // Get recent conversion history
        const history = await getConversionHistory(limit);
        return NextResponse.json({ history });
      }
    }

    if (type === 'executions') {
      // Get routine execution history
      const executions = await getUserRoutineExecutions();
      return NextResponse.json({ executions });
    }

    if (type === 'stats') {
      // Get conversion statistics
      const stats = await getConversionStatsByTool();
      return NextResponse.json({ stats });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('History API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
