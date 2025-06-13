import { deleteTokenCookie, getTokenFromRequest } from '@/lib/auth.backend';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  runtime: 'edge'
};

type TLogoutResponseData = {
  success: true;
  me: null;
};

async function logoutHandler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ success: false }, { status: 405 });
  }

  const response = NextResponse.json(
    {
      success: true,
      me: null
    } satisfies TLogoutResponseData,
    { status: 200 }
  );

  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  await deleteTokenCookie(response);

  return response;
}

export default logoutHandler;
