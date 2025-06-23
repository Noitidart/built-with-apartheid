import { getTokenFromRequest } from '@/lib/auth.backend';
import type { NextApiRequest, NextApiResponse } from 'next';

type TLogoutResponseData = {
  success: true;
  me: null;
};

async function logoutHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }

  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ success: false });
  }

  // Delete the access_token cookie
  res.setHeader('Set-Cookie', [
    `access_token=; Max-Age=0; Path=/; HttpOnly; SameSite=strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  ]);

  return res.status(200).json({
    success: true,
    me: null
  } satisfies TLogoutResponseData);
}

export default logoutHandler;
