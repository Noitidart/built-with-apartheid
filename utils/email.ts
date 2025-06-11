// utils/email.ts
import { ApartheidEmailAlert } from '@/components/ApartheidEmailAlert';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function tryEmailSend(
  userEmail: string,
  siteUrl: string,
  userName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: userEmail,
      subject: 'Monthly Apartheid Recap',
      react: ApartheidEmailAlert({
        siteUrl,
        userName,
        severityLevel: 'Critical',
        vulnerabilityName: 'Israeli technology',
        detectedTechnology: 'Israeli technology',
        firstDetectedDate: new Date().toLocaleString(),
        unsubscribeUrl: ''
      })
    });
    if (error) {
      throw error;
    }
    console.log('email id: ');
    console.log(data);

    return new Response(JSON.stringify({ data }), {
      status: 200
    });
  } catch (error) {
    console.error('Email failed:', error);
    throw error;
  }
}
