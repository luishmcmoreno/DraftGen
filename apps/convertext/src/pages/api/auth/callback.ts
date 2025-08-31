import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../lib/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { code } = req.query;

    if (code && typeof code === 'string') {
      const supabase = await createClient();
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return res.redirect(`/auth/error?message=${encodeURIComponent(error.message)}`);
      }
    }

    // Redirect to the main app
    return res.redirect('/');
  } catch (error) {
    console.error('Auth callback handler error:', error);
    return res.redirect('/auth/error?message=Authentication%20failed');
  }
}