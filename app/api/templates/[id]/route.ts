import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete the template (RLS will ensure user owns the template)
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id); // Extra safety check

    if (error) {
      // console.error('Error deleting template:', error);
      
      // Check if template exists and user has permission
      const { data: template } = await supabase
        .from('templates')
        .select('id')
        .eq('id', id)
        .single();
      
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found or you do not have permission to delete it' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
    
  } catch {
    // console.error('Error in template delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}