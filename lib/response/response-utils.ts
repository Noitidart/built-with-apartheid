import { NextResponse } from 'next/server';

/**
 * Updates a NextResponse's JSON body while preserving headers and cookies.
 * This is useful when you need to create a response early (for cookie setting)
 * but update the body later.
 */
export function updateNextResponseJson(
  response: NextResponse,
  data: unknown,
  init?: ResponseInit
): NextResponse {
  // Create new response with the data
  const newResponse = NextResponse.json(data, init);
  
  // Copy all cookies from original response
  response.cookies.getAll().forEach(cookie => {
    newResponse.cookies.set(cookie.name, cookie.value);
  });
  
  // Copy any custom headers (excluding standard ones that NextResponse.json sets)
  const headersToSkip = ['content-type', 'content-length'];
  response.headers.forEach((value, key) => {
    if (!headersToSkip.includes(key.toLowerCase())) {
      newResponse.headers.set(key, value);
    }
  });
  
  return newResponse;
}