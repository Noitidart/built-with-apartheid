import { NextResponse, type NextRequest } from 'next/server';

export const config = {
  runtime: 'edge'
};

export default function handler(req: NextRequest) {
  // Extract headers into a plain object
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const requestData = {
    method: req.method,
    url: req.url,
    nextUrl: {
      href: req.nextUrl.href,
      origin: req.nextUrl.origin,
      protocol: req.nextUrl.protocol,
      username: req.nextUrl.username,
      password: req.nextUrl.password,
      host: req.nextUrl.host,
      hostname: req.nextUrl.hostname,
      port: req.nextUrl.port,
      pathname: req.nextUrl.pathname,
      search: req.nextUrl.search,
      searchParams: Object.fromEntries(req.nextUrl.searchParams.entries()),
      hash: req.nextUrl.hash
    },
    headers: headers,
    // @ts-expect-error - geo is not typed
    geo: req.geo,
    // @ts-expect-error - ip is not typed
    ip: req.ip,
    // Try to get body if it exists
    bodyUsed: req.bodyUsed,
    cache: req.cache,
    credentials: req.credentials,
    destination: req.destination,
    integrity: req.integrity,
    mode: req.mode,
    redirect: req.redirect,
    referrer: req.referrer,
    referrerPolicy: req.referrerPolicy,
    signal: req.signal
  };

  console.log('=== REQUEST DATA ===');
  console.log(JSON.stringify(requestData, null, 2));
  console.log('=== END REQUEST ===');

  return NextResponse.json(requestData);
}
