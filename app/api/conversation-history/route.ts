import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ConversationMessage } from '@/lib/supabase/database.types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { templateId, messages } = await request.json();

    if (!templateId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Check if conversation history already exists for this template and user
    const { data: existing } = await supabase
      .from('conversation_history')
      .select('id')
      .eq('template_id', templateId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Update existing conversation history
      const { error } = await supabase
        .from('conversation_history')
        .update({
          messages: messages as ConversationMessage[],
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating conversation history:', error);
        return NextResponse.json(
          { error: 'Failed to update conversation history' },
          { status: 500 }
        );
      }
    } else {
      // Create new conversation history
      const { error } = await supabase
        .from('conversation_history')
        .insert({
          template_id: templateId,
          user_id: user.id,
          messages: messages as ConversationMessage[]
        });

      if (error) {
        console.error('Error creating conversation history:', error);
        return NextResponse.json(
          { error: 'Failed to save conversation history' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error in conversation history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('template_id', templateId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      console.error('Error fetching conversation history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversation history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      history: data || null 
    });
    
  } catch (error) {
    console.error('Error in conversation history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}