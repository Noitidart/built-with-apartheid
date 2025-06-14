import type { TMe } from '@/types/user';
import type { PrismaClient } from '@prisma/client';
import { SignJWT, jwtVerify } from 'jose';
import { customAlphabet } from 'nanoid';
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse
} from 'next';

// JWT token expiration (1 day)
const USER_TOKEN_JWT_MAX_AGE_SECONDS = 24 * 60 * 60;

// Cookie persists for 1 year to preserve user ID even when JWT expires.
// Browser max is 400 days, so we extend on each request for persistence.
const USER_TOKEN_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

const USER_TOKEN_COOKIE_NAME = 'access_token';

// Speed: 1000 IDs per second
// ~125 years or 3T IDs needed, in order to have a 1% probability of at least one collision.
export const userNanoidGenerator = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  11
);

function getJwtSecretTypeArray() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

type TJwtPayload = {
  userId: string;
  isAuthenticated: boolean;
};

async function derivePasswordHash(inputs: {
  password: string;
  salt: Uint8Array;
}): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(inputs.password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2 with 100,000 iterations
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: inputs.salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 bytes
  );

  return new Uint8Array(derivedBits);
}

/**
 * Hashes a password using PBKDF2 with a new random salt.
 *
 * Note: This function generates a new random salt each time it's called,
 * so hashPassword('same') !== hashPassword('same'). Do not use this for
 * password verification - use verifyPassword instead.
 *
 * In short:
 *   - hashPassword: generates new salt + calls derivePasswordHash
 *   - verifyPassword: extracts existing salt + calls derivePasswordHash
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty');
  }

  // Generate random salt (16 bytes)
  const randomSalt = crypto.getRandomValues(new Uint8Array(16));

  const hashArray = await derivePasswordHash({ password, salt: randomSalt });

  // Combine salt + hash and encode as base64
  const combined = new Uint8Array(randomSalt.length + hashArray.length);
  combined.set(randomSalt);
  combined.set(hashArray, randomSalt.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Verifies a password against a stored hash.
 *
 * While this looks similar to hashPassword, it extracts the existing salt
 * from the stored hash instead of generating a new one, which is required
 * for proper password verification.
 *
 * In short:
 *   - hashPassword: generates new salt + calls derivePasswordHash
 *   - verifyPassword: extracts existing salt + calls derivePasswordHash
 */
export async function verifyPassword(inputs: {
  password: string;
  hashedPassword: string;
}): Promise<boolean> {
  try {
    // Decode the base64 encoded stored hash
    const combined = new Uint8Array(
      atob(inputs.hashedPassword)
        .split('')
        .map((char) => char.charCodeAt(0))
    );

    // Extract salt (first 16 bytes) and hash (remaining bytes)
    const storedSalt = combined.slice(0, 16);
    const storedHash = combined.slice(16);

    const hashArray = await derivePasswordHash({
      password: inputs.password,
      salt: storedSalt
    });

    if (hashArray.length !== storedHash.length) {
      return false;
    }

    // Check if the hashed bytes match the stored bytes
    const isPasswordValid = hashArray.every(
      function isHashedByteEqualToStoredByte(inputByte, i) {
        const storedByte = storedHash[i];
        return inputByte === storedByte;
      }
    );

    return isPasswordValid;
  } catch (error) {
    console.error(
      'Failed to verify password will return false but here is the error check if it is valid error',
      { error }
    );

    return false;
  }
}

type TTokenAnalysis =
  | { status: 'tampered' }
  | { status: 'untampered-expired'; data: TJwtPayload }
  | { status: 'untampered-active'; data: TJwtPayload };

/**
 * Analyzes a JWT token to determine its status and extract payload if valid
 */
export async function analyzeToken(token: string): Promise<TTokenAnalysis> {
  try {
    const verificationResult = await jwtVerify<TJwtPayload>(
      token,
      getJwtSecretTypeArray()
    );

    return {
      status: 'untampered-active',
      data: verificationResult.payload
    };
  } catch (error) {
    // Check if it's an expiration error vs tampering
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ERR_JWT_EXPIRED'
    ) {
      if (
        'payload' in error &&
        error.payload &&
        typeof error.payload === 'object' &&
        'userId' in error.payload &&
        typeof error.payload.userId === 'string' &&
        'isAuthenticated' in error.payload &&
        typeof error.payload.isAuthenticated === 'boolean'
      ) {
        return {
          status: 'untampered-expired',
          data: error.payload as TJwtPayload
        };
      } else {
        console.error('Decoded data not available in expired token error', {
          token,
          error
        });
        return {
          status: 'tampered'
        };
      }
    }

    // Any other error means token is tampered
    return { status: 'tampered' };
  }
}

/**
 * Creates a JWT with the given payload
 */
export async function createToken(payload: TJwtPayload) {
  const expiresAtEpochSeconds =
    Math.floor(Date.now() / 1000) + USER_TOKEN_JWT_MAX_AGE_SECONDS;

  const token = await new SignJWT(
    // We don't just assign payload, as it may have extra fields.
    {
      userId: payload.userId,
      isAuthenticated: payload.isAuthenticated
    } satisfies TJwtPayload
  )
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAtEpochSeconds)
    .sign(getJwtSecretTypeArray());

  return token;
}

export function getTokenFromRequest(
  request: NextApiRequest | GetServerSidePropsContext['req']
): string | null {
  // Next.js adds an additional `cookies` object to the request - https://nextjs.org/docs/pages/api-reference/functions/get-server-side-props
  return request.cookies[USER_TOKEN_COOKIE_NAME] || null;
}

/**
 * Validates token and returns user info with appropriate token handling
 *
 * Flow:
 * 1. No token → Create new user + new anonymous token
 * 2. Tampered token → Create new user + new anonymous token
 * 3. Valid (untampered) but expired token → Extract userId, downgrade to
 *    anonymous, refresh token
 * 4. Valid (untampered) and active token → Keep same auth state, don't refresh
 *    token, return fresh DB data
 * 5. If untampered and active and user is logged in, but user not found in DB
 *    (e.g. user was deleted) → Create new user + new anonymous token
 *
 * Note: When a new user has to be created, it's only in the token, and not in
 * the DB. The DB user is only created when that user does hits a mutation
 * endpoint. If we don't set it to cookie, then every page load for an anonymous
 * user that has not yet made a mutation will get a new user id every time. And
 * if we insert to the database, it will insert every time.
 */
export async function getMeFromRefreshedToken(inputs: {
  prisma: PrismaClient;
  request: NextApiRequest | GetServerSidePropsContext['req'];
  response: NextApiResponse | GetServerSidePropsContext['res'];
}): Promise<TMe> {
  let userId: string;
  let isAuthenticated = false;
  let isNewUser = false;

  const token = getTokenFromRequest(inputs.request);
  if (!token) {
    // Case 1: No token → Create new user + new anonymous token
    userId = userNanoidGenerator();
    isNewUser = true;
  } else {
    const analysis = await analyzeToken(token);

    switch (analysis.status) {
      case 'untampered-active':
        // Case 4: Valid and active token → Keep same auth state, don't refresh token
        userId = analysis.data.userId;
        isAuthenticated = analysis.data.isAuthenticated;
        break;

      case 'untampered-expired':
        // Case 3: Valid but expired token → Extract userId, downgrade to anonymous, refresh token
        userId = analysis.data.userId;
        isAuthenticated = false; // Downgrade authentication
        break;

      case 'tampered':
        // Case 2: Tampered token → Create new user + new anonymous token
        userId = userNanoidGenerator();
        isNewUser = true;
        break;
    }
  }

  const DEFAULT_EMAIL = null;
  const DEFAULT_IS_MOD = false;
  // Smart database operation: create new user or fetch existing
  let user;
  if (isNewUser) {
    // Create new user with default values
    user = {
      id: userId,
      email: DEFAULT_EMAIL,
      isMod: DEFAULT_IS_MOD,
      isAuthenticated
    };

    await setTokenCookie(inputs.response, {
      userId,
      isAuthenticated
    });
  } else {
    // Fetch existing user data
    user = await inputs.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isMod: true
      }
    });

    if (!user) {
      const isLocalAnonymousUser = !user && !isAuthenticated;
      if (isLocalAnonymousUser) {
        user = {
          id: userId,
          email: DEFAULT_EMAIL,
          isMod: DEFAULT_IS_MOD,
          isAuthenticated
        };
      } else {
        // Case 5: User was not found in database but is logged in, so maybe
        // user was deleted, so make a new anonymous user
        isNewUser = true;
        isAuthenticated = false;
        userId = userNanoidGenerator();
        user = {
          id: userId,
          email: DEFAULT_EMAIL,
          isMod: DEFAULT_IS_MOD,
          isAuthenticated
        };

        await setTokenCookie(inputs.response, {
          userId,
          isAuthenticated
        });
      }
    }
  }

  return {
    id: userId,
    email: user.email,
    isMod: user.isMod,
    isAuthenticated
  };
}

type SetCookieOptions = {
  httpOnly: boolean;
  path: string;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
};

function getTokenCookieOptions(): SetCookieOptions {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  };
}

export async function setTokenCookie(
  response: NextApiResponse | GetServerSidePropsContext['res'],
  payload: TJwtPayload
) {
  const token = await createToken(payload);

  const options = getTokenCookieOptions();

  const cookieString = [
    `${USER_TOKEN_COOKIE_NAME}=${token}`,
    `Max-Age=${USER_TOKEN_COOKIE_MAX_AGE_SECONDS}`,
    `Path=${options.path}`,
    `SameSite=${options.sameSite}`,
    options.httpOnly && 'HttpOnly',
    options.secure && 'Secure'
  ]
    .filter(Boolean)
    .join('; ');

  response.setHeader('Set-Cookie', cookieString);
}

export async function deleteTokenCookie(
  response: NextApiResponse | GetServerSidePropsContext['res']
) {
  const options = getTokenCookieOptions();
  const cookieString = [
    `${USER_TOKEN_COOKIE_NAME}=`,
    `Max-Age=0`,
    `Path=${options.path}`,
    `SameSite=${options.sameSite}`,
    options.httpOnly && 'HttpOnly',
    options.secure && 'Secure'
  ]
    .filter(Boolean)
    .join('; ');

  response.setHeader('Set-Cookie', cookieString);
}
