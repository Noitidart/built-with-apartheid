/**
 * Sends email notifications to all watchers of a website when it's clean
 *
 */

import { sendBulkEmail } from '@/lib/resend';
import type { PrismaClient } from '@prisma/client';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text
} from '@react-email/components';

export async function emailNowCleanToWatchers({
  prisma,
  websiteId
}: {
  prisma: PrismaClient;
  websiteId: number;
}) {
  // Fetch website and its watchers
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    select: {
      hostname: true,
      watchers: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });

  if (!website) {
    throw new Error(`No website found for id ${websiteId}`);
  }

  const watcherEmails = website.watchers
    .map((watcher) => watcher.email)
    .filter((email): email is string => email !== null);

  if (watcherEmails.length === 0) {
    return;
  }

  // Prepare email data
  const emailProps = {
    websiteHostname: website.hostname,
    watcherCount: website.watchers.length
  };

  // Generate plain text version
  const plainText = `🎉 ${website.hostname} is now CLEAN! 🎉\n\nCongratulations! This website has been fully cleared of apartheid technology.\n\nThank you for your vigilance and effort in making the web a more just place.\n\nLet&apos;s keep pushing forward and help more sites become apartheid-free!\n\n---\n\nYou are receiving this email because you are watching ${website.hostname}.\nTo stop receiving these notifications, visit the website and click \"Unwatch\".`;

  // Send emails to all watchers
  const result = await sendBulkEmail({
    to: watcherEmails,
    subject: `🎉 ${website.hostname} is now CLEAN! Thank you for your help!`,
    react: SiteNowCleanEmail(emailProps),
    text: plainText
  });

  return {
    success: true,
    ...result
  };
}

// Updated props for the celebratory email
interface TSiteNowCleanEmailProps {
  websiteHostname: string;
  watcherCount: number;
}

function SiteNowCleanEmail({
  websiteHostname,
  watcherCount
}: TSiteNowCleanEmailProps) {
  const previewText = `🎉 ${websiteHostname} is now CLEAN!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainCelebratory}>
        <Container style={containerCelebratory}>
          <Heading style={h1Celebratory}>
            🎉 {websiteHostname} is now CLEAN! 🎉
          </Heading>

          <Section style={sectionCelebratory}>
            <Text style={paragraphCelebratory}>
              <b>Congratulations!</b> <br />
              <span role="img" aria-label="party">
                🥳
              </span>{' '}
              This website has been fully cleared of apartheid technology.
              <br />
              <br />
              <b>Thank you</b> to everyone who watched, reported, and
              contributed. Your vigilance and action made this possible.{' '}
              {watcherCount > 1 ? `You and ${watcherCount - 1} others` : 'You'}{' '}
              helped make the web a more just place.
            </Text>

            <Section style={celebrateBox}>
              <Text style={celebrateText}>
                Let&apos;s keep moving forward and help more sites become
                apartheid-free! Call, email, and pressure company
                representatives!
              </Text>
            </Section>

            <Hr style={hrCelebratory} />

            <Text style={footerCelebratory}>
              You are receiving this email because you are watching{' '}
              <b>{websiteHostname}</b>.<br />
              To stop receiving these notifications, visit the website and click
              &quot;Unwatch&quot;.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// --- Celebratory styles ---
const mainCelebratory = {
  backgroundColor: '#f0f7ed',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  minHeight: '100vh' // for a more open feel
};

const containerCelebratory = {
  backgroundColor: '#fff',
  margin: '0 auto',
  padding: '32px 0 48px',
  marginBottom: '64px',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)'
};

const sectionCelebratory = {
  padding: '0 48px',
  textAlign: 'center' as const
};

const h1Celebratory = {
  color: '#1a7f37',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
  padding: '0',
  textAlign: 'center' as const,
  letterSpacing: '1px',
  textShadow: '0 2px 8px #e6ffe6'
};

const paragraphCelebratory = {
  color: '#333',
  fontSize: '18px',
  lineHeight: '28px',
  margin: '24px 0',
  textAlign: 'center' as const
};

const celebrateBox = {
  background: 'linear-gradient(90deg, #e0ffe0 0%, #f9fbe7 100%)',
  borderRadius: '10px',
  padding: '20px',
  margin: '32px 0',
  border: '2px solid #b6e6b6',
  boxShadow: '0 2px 8px #e6ffe6'
};

const celebrateText = {
  color: '#1a7f37',
  fontSize: '20px',
  fontWeight: 'bold',
  textAlign: 'center' as const
};

const hrCelebratory = {
  borderColor: '#e6ebf1',
  margin: '32px 0'
};

const footerCelebratory = {
  color: '#8898aa',
  fontSize: '13px',
  lineHeight: '18px',
  marginTop: '32px',
  textAlign: 'center' as const
};
