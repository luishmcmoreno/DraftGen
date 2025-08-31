import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAIProvider, AIError } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, existingJson } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 });
    }

    // Get AI provider and generate template
    const provider = getAIProvider();
    const result = await provider.generateTemplate({
      prompt,
      existingJson,
    });

    return NextResponse.json(result);
  } catch (error) {
    // Handle specific AI errors
    if (error instanceof AIError) {
      if (error.code === 'RATE_LIMIT') {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.code === 'INVALID_RESPONSE') {
        return NextResponse.json(
          { error: 'Failed to generate valid template. Please try again.' },
          { status: 422 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
