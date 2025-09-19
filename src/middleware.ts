
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Extract the subdomain from the hostname
  const subdomain = hostname.split('.')[0];
  
  // NOTE: In a production environment, you would use your actual domains.
  // For local development, you'll need to edit your hosts file to map these
  // subdomains to localhost, e.g.:
  // 127.0.0.1 user.localhost
  // 127.0.0.1 trader.localhost
  // 127.0.0.1 admin.localhost

  if (subdomain === 'admin') {
    url.pathname = `/admin${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (subdomain === 'trader') {
    url.pathname = `/trader${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // For the main domain (or user.localhost), we serve the (main) group
  url.pathname = `/${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
