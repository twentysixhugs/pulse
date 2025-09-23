
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // This middleware is currently a no-op.
  // It is kept for potential future use cases like domain-based routing or advanced auth checks.
  return NextResponse.next();
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
