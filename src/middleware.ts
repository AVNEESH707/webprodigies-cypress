import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // In dev mode, skip auth checks to allow testing without Supabase
  const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  
  if (devMode) {
    // Development mode: allow all requests to proceed
    return res;
  }
  
  const supabase = createMiddlewareClient({ req, res });
  
  // Get session with timeout to prevent long hangs
  let session = null;
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
    );
    
    const { data } = await Promise.race([
      supabase.auth.getSession(),
      timeoutPromise,
    ] as any);
    
    session = data?.session || null;
  } catch (error) {
    // Silent fail on timeout - don't log to reduce noise
    session = null;
  }
  
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  const emailLinkError = 'Email link is invalid or has expired';
  if (
    req.nextUrl.searchParams.get('error_description') === emailLinkError &&
    req.nextUrl.pathname !== '/signup'
  ) {
    return NextResponse.redirect(
      new URL(
        `/signup?error_description=${req.nextUrl.searchParams.get(
          'error_description'
        )}`,
        req.url
      )
    );
  }

  if (['/login', '/signup'].includes(req.nextUrl.pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  return res;
}
