// lib/email.ts
'use server';
import { ApartheidEmailAlert } from '@/components/ApartheidEmailAlert';
import { Resend } from 'resend';
// process.env.DATABASE_URL!
console.log('resend api key: ' + process.env.RESEND_API_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendUnethicalSiteAlert(
  userEmail: string,
  userName: string,
  siteUrl: string
) {
  try {
    await resend.emails.send({
      from: 'ethics-alerts@yourdomain.com',
      to: userEmail,
      subject: `Ethics Alert: ${siteUrl} flagged`,
      react: ApartheidEmailAlert({ siteUrl, userName })
    });
  } catch (error) {
    console.error(`Failed to send email to ${userEmail}`, error);
    // Implement retry logic or store failed attempts
  }
}
