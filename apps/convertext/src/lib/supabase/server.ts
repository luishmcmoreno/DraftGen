import { createServerClient } from '@supabase/ssr';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Database } from './database.types';

export function createClient(req: NextApiRequest, res: NextApiResponse) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.keys(req.cookies).map((name) => ({
            name,
            value: req.cookies[name] || '',
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.setHeader(
              'Set-Cookie',
              `${name}=${value}; ${
                options
                  ? Object.entries(options)
                      .map(([key, val]) => `${key}=${val}`)
                      .join('; ')
                  : ''
              }`
            );
          });
        },
      },
    }
  );
}
