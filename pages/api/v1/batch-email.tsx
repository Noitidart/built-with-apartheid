import { ApartheidEmailAlert } from '@/components/ApartheidEmailAlert';
// import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { resend } from './send-email';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { recipients, siteUrl } = req.body;

  if (!recipients || !Array.isArray(recipients)) {
    return res.status(400).json({ error: 'Missing or invalid recipients' });
  }
  console.log('in batch email');
  console.log(recipients, siteUrl);

  // to do add more specific props, number of active users, scans, changes, etc to send in email
  const promises = recipients.map(({ email, userName }) =>
    resend.emails.send({
      // from: 'Acme <onboarding@resend.dev>',
      from: 'BWA <builtWithApartheid@resend.dev>',
      to: email,
      subject: 'Monthly Apartheid Recap', // to do change this to more specific thing
      react: ApartheidEmailAlert({
        siteUrl,
        userName,
        severityLevel: 'Critical',
        vulnerabilityName: 'Israeli technology',
        detectedTechnology: 'Israeli technology',
        firstDetectedDate: new Date().toLocaleString(),
        unsubscribeUrl: ''
      })
    })
  );
  // console.log('after setup');

  const results = await Promise.allSettled(promises);

  const successCount = results.filter((r) => r.status === 'fulfilled').length;
  const failureCount = results.length - successCount;
  console.log(`Success ${successCount}, Failure: ${failureCount}`);

  res.status(200).json({ successCount, failureCount });
}
