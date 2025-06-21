// import { ApartheidEmailAlert } from '@/components/ApartheidEmailAlert';
import { sendEnhancedEmailAlert } from '@/lib/email';

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
export const config = {
  runtime: 'edge'
};
export const resend = new Resend(process.env.RESEND_API_KEY);

export const ScanRequestBodySchema = z.object({
  siteUrl: z.string().min(1, 'URL is required').default('bad-site.org'),
  userEmail: z
    .string()
    .min(3, 'Email is required')
    .default('izughyer@gmail.com'),
  userName: z.string().min(1, 'User name is required').default('curious user')
});

export default async function handleSendSingleEmail(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405
    });
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400
    });
  }

  const result = ScanRequestBodySchema.safeParse(data);
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: result.error.format()
      }),
      {
        status: 400
      }
    );
  }
  const body = result.data;

  // Validate required fields
  const { userEmail, siteUrl, userName } = body;
  if (!userEmail) {
    return NextResponse.json({ error: 'Missing userEmail' }, { status: 400 });
  }
  console.log('before sending email about ' + siteUrl + ' to ' + userEmail);
  // Send email
  try {
    const result = await sendEnhancedEmailAlert(userEmail, userName, siteUrl);
    // const { data, error } = await resend.emails.send({
    //   from: 'Acme <onboarding@resend.dev>',
    //   to: userEmail,
    //   subject: 'Monthly Apartheid Recap',
    //   react: ApartheidEmailAlert({
    //     siteUrl,
    //     userName,
    //     severityLevel: 'Critical',
    //     vulnerabilityName: 'Israeli technology',
    //     detectedTechnology: 'Israeli technology',
    //     firstDetectedDate: new Date().toLocaleString(),
    //     unsubscribeUrl: ''
    //   })
    // });

    if (result?.error) {
      throw result.error;
    }
    console.log('email id: ');
    console.log(data);

    return new Response(JSON.stringify({ data: data ? data : result?.data }), {
      status: 200
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
