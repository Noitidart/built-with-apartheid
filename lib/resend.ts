import { ReactElement } from 'react';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type TSendBulkEmailOptions = {
  to: string[];
  subject: string;
  react: ReactElement;
  from?: string;
  text?: string;
};

export async function sendBulkEmail({
  to,
  subject,
  react,
  from = 'Built With Apartheid <no-reply@builtwithapartheid.com>',
  text
}: TSendBulkEmailOptions) {
  const results = [];
  const errors = [];

  // Process emails in batches of 50
  for (let i = 0; i < to.length; i += 50) {
    const batch = to.slice(i, i + 50);

    try {
      const data = await resend.emails.send({
        from,
        to: 'Built With Apartheid <delivered@builtwithapartheid.com>',
        bcc: batch,
        subject,
        react,
        text
      });

      results.push({
        batch,
        data,
        success: true
      });
    } catch (error) {
      errors.push({
        batch,
        error,
        success: false
      });
    }
  }

  return {
    results,
    errors,
    totalSent: results.reduce((acc, r) => acc + r.batch.length, 0),
    totalFailed: errors.reduce((acc, e) => acc + e.batch.length, 0)
  };
}
