import { deleteJwtCookie } from '@/lib/auth.backend';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  runtime: 'edge'
};

function logoutHandler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ success: false }, { status: 405 });
  }

  const response = NextResponse.json({ success: true });

  deleteJwtCookie(response);

  return response;
}

export default logoutHandler;
