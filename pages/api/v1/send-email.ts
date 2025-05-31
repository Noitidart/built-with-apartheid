import { ApartheidEmailAlert } from '@/components/ApartheidEmailAlert';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  // Check method
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Parse JSON body safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = await request.json();
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate required fields
  const { userEmail, siteUrl, userName } = data;
  if (!userEmail) {
    return NextResponse.json({ error: 'Missing userEmail' }, { status: 400 });
  }

  // Send email
  try {
    await resend.emails.send({
      from: 'ethics-alerts@yourdomain.com',
      to: userEmail,
      subject: `Ethics Alert: ${siteUrl} flagged`,
      react: ApartheidEmailAlert({ siteUrl, userName })
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
