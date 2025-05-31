import { ApartheidEmailAlert } from '@/components/ApartheidEmailAlert';

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
export const config = {
  runtime: 'edge'
};
const resend = new Resend(process.env.RESEND_API_KEY);

const ScanRequestBodySchema = z.object({
  siteUrl: z.string().min(1, 'URL is required'),
  userEmail: z.string().min(3, 'Email is required'),
  userName: z.string().min(1, 'User name is required')
});

export default async function handleSendEmail(req: NextRequest) {
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
    // await resend.emails.send({
    //   from: 'ethics-alerts@yourdomain.com',
    //   to: userEmail,
    //   subject: `Ethics Alert: ${siteUrl} flagged`,
    //   react: ApartheidEmailAlert({ siteUrl, userName })
    // });
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: userEmail,
      subject: 'Hello world',
      react: ApartheidEmailAlert({ siteUrl, userName })
    });

    if (error) {
      throw error;
      // return res.status(400).json(error);
    }
    console.log('email id: ');
    console.log(data);

    return new Response(JSON.stringify({ data }), {
      status: 200
    });
  } catch (error) {
    console.log(error);
    throw error;
    // return NextResponse.json(
    //   { error: 'Failed to send email' },
    //   { status: 500 }
    // );
  }
}
