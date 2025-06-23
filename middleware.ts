import { analyzeToken, getTokenFromEdgeRequest } from '@/lib/auth.backend';
import { getEdgeRequestIp } from '@/lib/cf-utils.backend';
import { isIpBanned, isUserBanned } from '@/utils/ban';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const clientIp = getEdgeRequestIp(request);

  if (clientIp && (await isIpBanned(clientIp))) {
    console.log('IP is banned:', clientIp);
    return NextResponse.redirect(new URL('/restricted', request.url));
  }

  const token = getTokenFromEdgeRequest(request);
  if (token) {
    const tokenAnalysis = await analyzeToken(token);
    if ('data' in tokenAnalysis) {
      if (await isUserBanned(tokenAnalysis.data.userId)) {
        console.log('User id is banned:', tokenAnalysis.data.userId);
        return NextResponse.redirect(new URL('/restricted', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - banned (banned page)
     * - Files with extensions (.js, .css, .png, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|restricted|.*\\..*).*)'
  ]
};
