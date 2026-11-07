import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .maybeSingle();

    const userRole = profile?.user_role;

    // Cross-role guardrail 1: RENTER cannot reach /post-property
    if (userRole === 'RENTER' && pathname.startsWith('/post-property')) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('error', 'renter_cannot_post');
      return NextResponse.redirect(url, { status: 307 });
    }

    // Cross-role guardrail 2: OWNER cannot browse /search
    if (userRole === 'OWNER' && pathname.startsWith('/search')) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('error', 'owner_cannot_search');
      return NextResponse.redirect(url, { status: 307 });
    }

    // Cross-role guardrail 3: OWNER cannot view /properties/:path*
    if (userRole === 'OWNER' && pathname.startsWith('/properties/')) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('error', 'owner_cannot_view_rental');
      return NextResponse.redirect(url, { status: 307 });
    }
  }

  return response;
}

export const config = {
  matcher: ['/post-property/:path*', '/search/:path*', '/properties/:path*'],
};
