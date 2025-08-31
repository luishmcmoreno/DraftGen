import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== AUTH CALLBACK HANDLER ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;
  
  if (!code || typeof code !== 'string') {
    console.log('No code provided, redirecting home');
    return res.redirect('/');
  }

  console.log('Processing auth code:', code.substring(0, 10) + '...');

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return Object.entries(req.cookies).map(([name, value]) => ({ name, value: value || '' }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=lax; Max-Age=3600`);
            });
          },
        },
      }
    );

    supabase.auth.exchangeCodeForSession(code)
      .then(({ data, error }) => {
        if (error) {
          console.error('Auth exchange error:', error);
          return res.redirect(`/auth/error?message=${encodeURIComponent(error.message)}`);
        }
        
        console.log('Auth exchange successful');
        return res.redirect('/');
      })
      .catch((error) => {
        console.error('Auth exchange exception:', error);
        return res.redirect('/auth/error?message=Authentication%20failed');
      });

  } catch (error) {
    console.error('Callback handler error:', error);
    return res.redirect('/auth/error?message=Server%20error');
  }
}