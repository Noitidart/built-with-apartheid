import type { NextApiRequest } from 'next';
import type { NextRequest } from 'next/server';

// Helper to get client IP from request
export function getRequestIp(request: NextApiRequest): string | null {
  // Check various headers for the real IP
  const headers = request.headers;

  if (process.env.NODE_ENV === 'development') {
    return '127.0.0.1';
  }

  const cfConnectingIp = headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  }

  const realIp = headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return null;
}

// Helper to get client IP from NextRequest (for middleware)
export function getEdgeRequestIp(request: NextRequest): string | null {
  // Check various headers for the real IP
  const headers = request.headers;

  if (process.env.NODE_ENV === 'development') {
    return '127.0.0.1';
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return null;
}
