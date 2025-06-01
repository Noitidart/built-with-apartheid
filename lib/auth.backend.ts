import type { TMe } from '@/types/user';
import type { PrismaClient } from '@prisma/client';
import { SignJWT, jwtVerify } from 'jose';
import type { GetServerSidePropsContext } from 'next';
import type { NextResponse } from 'next/server';

const JWT_TOKEN_COOKIE_NAME = 'access_token';
const JWT_TOKEN_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;

function getJwtSecretTypeArray() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

type TJwtPayload = {
  userId: string;
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

export async function signJwt(payload: TJwtPayload): Promise<{
  token: string;
  expiresAtEpochSeconds: number;
}> {
  const expiresAtEpochSeconds = Date.now() + JWT_TOKEN_COOKIE_MAX_AGE_SECONDS;
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAtEpochSeconds)
    .sign(getJwtSecretTypeArray());

  return {
    token,
    expiresAtEpochSeconds
  };
}

/**
 * @param token - The JWT token to verify.
 * @returns The JWT payload if the token is valid, otherwise null.
 */
async function verifyJwt(token: string): Promise<TJwtPayload | null> {
  try {
    const verificationResult = await jwtVerify<TJwtPayload>(
      token,
      getJwtSecretTypeArray()
    );

    return verificationResult.payload;
  } catch (error) {
    console.error(
      'Failed to verify JWT will return null but here is the error',
      { error }
    );

    return null;
  }
}

/**
 * @returns me - null if not logged in.
 */
export async function getMe(
  context: GetServerSidePropsContext,
  prisma: PrismaClient
): Promise<TMe | null> {
  const token = context.req.cookies[JWT_TOKEN_COOKIE_NAME];

  if (!token) {
    return null;
  }

  const jwtPayload = await verifyJwt(token);
  if (!jwtPayload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: jwtPayload.userId },
    select: {
      id: true,
      email: true,
      isMod: true
    }
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    isMod: user.isMod
  };
}

export async function setJwtCookie(
  response: NextResponse,
  payload: TJwtPayload
) {
  const { token, expiresAtEpochSeconds } = await signJwt(payload);

  response.cookies.set(JWT_TOKEN_COOKIE_NAME, token, {
    ...getJwtCookieOptions(),
    expires: new Date(expiresAtEpochSeconds * 1000)
  });
}

export async function deleteJwtCookie(response: NextResponse) {
  response.cookies.set(JWT_TOKEN_COOKIE_NAME, '', {
    ...getJwtCookieOptions(),
    maxAge: 0
  });
}

type SetCookieParams = Extract<
  Parameters<NextResponse['cookies']['set']>,
  [key: string, value: string, cookie?: unknown]
>;
type SetCookieOptions = NonNullable<SetCookieParams[2]>;

function getJwtCookieOptions(): SetCookieOptions {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  };
}
