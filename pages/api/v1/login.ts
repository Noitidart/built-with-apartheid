import type { TResponseDataWithErrors } from '@/lib/response/response-error-utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { setJwtCookie, verifyPassword } from '../../../lib/auth.backend';
import { withPrisma } from '../../../lib/prisma';

export const config = {
  runtime: 'edge'
};

export type TLoginRequestBody = {
  email: string;
  password: string;
};

const loginRequestBodySchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(1)
}) satisfies z.ZodSchema<TLoginRequestBody>;

type TLoginResponseData = TResponseDataWithErrors & {
  success: boolean;
};

const loginHandler = withPrisma(async function loginHandler(
  prisma,
  req: NextRequest
) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      {
        success: false,
        _errors: {
          formErrors: ['requestErrors.methodNotAllowed'],
          fieldErrors: {}
        }
      } satisfies TLoginResponseData,
      { status: 405 }
    );
  }

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: {}
        }
      } satisfies TLoginResponseData,
      { status: 400 }
    );
  }

  const bodyParseResult = loginRequestBodySchema.safeParse(rawBody);
  if (!bodyParseResult.success) {
    return NextResponse.json(
      {
        success: false,
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: bodyParseResult.error.flatten().fieldErrors
        }
      } satisfies TLoginResponseData,
      { status: 400 }
    );
  }

  const body = bodyParseResult.data;

  const user = await prisma.user.findUnique({
    where: { email: body.email.trim() },
    select: {
      id: true,
      email: true,
      password: true,
      isMod: true
    }
  });

  if (!user || !user.password) {
    return NextResponse.json(
      {
        success: false,
        _errors: { formErrors: ['authErrors.invalidCredentials'] }
      },
      { status: 401 }
    );
  }

  const isValidPassword = await verifyPassword({
    password: body.password,
    hashedPassword: user.password
  });
  if (!isValidPassword) {
    return NextResponse.json(
      {
        success: false,
        _errors: {
          formErrors: ['authErrors.invalidCredentials'],
          fieldErrors: {}
        }
      } satisfies TLoginResponseData,
      { status: 401 }
    );
  }

  const response = NextResponse.json(
    {
      success: true
    } satisfies TLoginResponseData,
    { status: 200 }
  );

  await setJwtCookie(response, {
    userId: user.id
  });

  return response;
});

export default loginHandler;
