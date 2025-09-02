import { NextResponse } from 'next/server';
import { logger } from '@draft-gen/logger';
import { TextTools } from '../../../src/lib/text-tools';

export async function GET() {
  try {
    const signatures = TextTools.getToolSignatures();
    return NextResponse.json(signatures);
  } catch (error) {
    logger.error('Tool signatures API Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
