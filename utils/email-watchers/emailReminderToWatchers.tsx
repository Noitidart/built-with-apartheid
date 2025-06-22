/**
 * Sends reminder emails to watchers of websites that are still infected.
 * Encourages them to share their outreach efforts with the community.
 */

import { COMPANIES } from '@/constants/companies';
import { sendBulkEmail } from '@/lib/resend';
import type { TScan } from '@/types/scan';
import type { PrismaClient } from '@prisma/client';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components';

type TEmailReminderToWatchersOptions = {
  prisma: PrismaClient;
};

export async function emailReminderToWatchers({
  prisma
}: TEmailReminderToWatchersOptions) {
  const infectedWebsites = await prisma.$queryRaw<
    Array<{
      interactionId: number;
      websiteId: number;
      createdAt: Date;
      changes: TScan['changes'];
      hostname: string;
      watcherEmails: string[];
    }>
  >`
    WITH latest_scans AS (
      -- Get THE latest scan for each website (infected or not)
      SELECT DISTINCT ON (i."websiteId")
        i.id as "interactionId",
        i."websiteId",
        i."createdAt",
        s.changes,
        w.hostname
      FROM "Interaction" i
      INNER JOIN "Scan" s ON s."interactionId" = i.id
      INNER JOIN "Website" w ON w.id = i."websiteId"
      WHERE i.type = 'SCAN'
      ORDER BY i."websiteId", i."createdAt" DESC
    )
    SELECT 
      ls.*,
      -- LEFT JOIN ensures we get all infected websites, even those with no watchers
      -- Websites with no watchers will have an empty array [] for watcherEmails
      COALESCE(array_agg(u.email) FILTER (WHERE u.email IS NOT NULL), ARRAY[]::text[]) as "watcherEmails"
    FROM latest_scans ls
    LEFT JOIN "_WatchedWebsites" ww ON ww."B" = ls."websiteId"
    LEFT JOIN "User" u ON u.id = ww."A"
    WHERE EXISTS (
      -- Filter to only include websites whose latest scan has infections
      SELECT 1 FROM jsonb_each_text(ls.changes::jsonb) 
      WHERE value IN ('new', 'still-present')
    )
    GROUP BY 
      ls."interactionId",
      ls."websiteId",
      ls."createdAt",
      ls.changes,
      ls.hostname
  `;

  console.log(
    `Found ${infectedWebsites.length} currently infected websites with watchers`
  );

  // Send emails to all watchers

  for (const websiteData of infectedWebsites) {
    // Skip websites with no watchers - the query returns ALL infected websites,
    // including those without watchers (which have an empty watcherEmails array)
    if (websiteData.watcherEmails.length === 0) {
      console.error(
        `No watchers found for ${websiteData.hostname} this should be impossible as the query only returns infected websites with watchers`
      );
      continue;
    }

    // Get active companies from the changes JSON
    const activeCompanies = Object.entries(websiteData.changes)
      .filter(function filterActiveCompanies([_, status]) {
        return status === 'new' || status === 'still-present';
      })
      .map(function findCompanyById([companyId]) {
        return COMPANIES.find(function matchCompanyId(c) {
          return c.id === companyId;
        });
      })
      .filter(function isCompanyDefined(company): company is NonNullable<
        typeof company
      > {
        return company !== undefined;
      });

    // For now, we'll use the scan date as a simple indicator
    // In a real implementation, you'd want to track first detection separately
    const daysSinceDetection = Math.floor(
      (Date.now() - new Date(websiteData.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const emailProps = {
      hostname: websiteData.hostname,
      websiteId: websiteData.websiteId,
      daysSinceFirst: daysSinceDetection,
      firstDetectedAt: websiteData.createdAt,
      totalScans: 0, // Would need separate query for this
      totalPosters: 0, // Would need separate query for this
      activeCompanies: activeCompanies.map(function getCompanyName(c) {
        return c.name;
      })
    };

    const websiteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${websiteData.hostname}`;

    await sendBulkEmail({
      to: websiteData.watcherEmails,
      subject: `${websiteData.hostname} still using Israeli tech`,
      react: ReminderEmail(emailProps),
      text: generatePlainText(emailProps, websiteUrl)
    });
  }
}

function generatePlainText(
  props: {
    hostname: string;
    daysSinceFirst: number;
    firstDetectedAt: Date;
    totalScans: number;
    totalPosters: number;
    activeCompanies: string[];
  },
  websiteUrl: string
): string {
  const companiesList =
    props.activeCompanies.length > 0
      ? props.activeCompanies
          .map(function formatCompanyListItem(c) {
            return `- ${c}`;
          })
          .join('\n')
      : '- Israeli technology detected';

  return `⚠️ ACTION NEEDED: ${props.hostname} is still using Israeli technology

${props.hostname} continues to use technology that is compromising the data of the owner and visitors.

Israeli technologies detected:
${companiesList}

🎯 TAKE ACTION NOW:

1. Contact the website owner
2. Share your outreach experience
3. Help others join the effort

Visit ${websiteUrl} to:
- Share what contact methods you've tried
- See what others are doing
- Coordinate efforts with the community

Every action counts. Your voice matters.

Quick actions you can take:
✉️ Email their support
📱 Call their office
💬 Use their contact form
📢 Try their social media

Share your efforts at: ${websiteUrl}

Together, we can make a difference.

---
You're watching ${props.hostname} • Unwatch at ${websiteUrl}`;
}

type TReminderEmailProps = {
  hostname: string;
  websiteId: number;
  daysSinceFirst: number;
  firstDetectedAt: Date;
  totalScans: number;
  totalPosters: number;
  activeCompanies: string[];
};

function ReminderEmail({ hostname, activeCompanies }: TReminderEmailProps) {
  const previewText = `Action needed: ${hostname} still using Israeli tech`;
  const websiteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${hostname}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with urgency */}
          <Section style={headerSection}>
            <Heading style={h1}>
              ⚠️ Take action: {hostname} needs your voice
            </Heading>
            <Text style={subheading}>
              This website continues to use Israeli technology that is
              compromising the data of the owner and visitors.
            </Text>
          </Section>

          <Section style={section}>
            {/* Status Card */}
            <div style={statusCard}>
              <Text style={statusTitle}>⚡ Quick Overview</Text>
              <Hr style={hr} />
              <Text style={techListTitle}>Israeli technologies detected:</Text>
              {activeCompanies.map(function renderCompanyItem(company) {
                return (
                  <Text key={company} style={techListItem}>
                    • {company}
                  </Text>
                );
              })}
            </div>

            {/* Call to Action */}
            <div style={ctaSection}>
              <Heading as="h2" style={h2}>
                🎯 Take Action Now
              </Heading>

              <div style={actionCard}>
                <Text style={actionTitle}>Quick actions you can take:</Text>
                <Text style={bulletPoint}>✉️ Email their support team</Text>
                <Text style={bulletPoint}>📱 Call their office</Text>
                <Text style={bulletPoint}>💬 Use their contact form</Text>
                <Text style={bulletPoint}>📢 Try their social media</Text>
              </div>

              <Button style={primaryButton} href={websiteUrl}>
                Share Your Outreach Efforts
              </Button>

              <div style={questionCard}>
                <Text style={questionText}>
                  Already contacted them? Share your experience:
                </Text>
                <Text style={bulletPoint}>• What methods worked best?</Text>
                <Text style={bulletPoint}>• What response did you get?</Text>
                <Text style={bulletPoint}>• Tips for others?</Text>
              </div>

              <Text style={paragraph}>
                <Link href={websiteUrl} style={link}>
                  See what the community is doing →
                </Link>
              </Text>
            </div>

            {/* Why this matters */}
            <div style={whySection}>
              <Text style={whyTitle}>Why this matters</Text>
              <Text style={whyText}>
                By using Israeli technology, this website is indirectly
                supporting apartheid. Your action can help them switch to
                ethical alternatives and protect their visitors from
                compromising technology.
              </Text>
            </div>

            <Hr style={hr} />

            <Text style={footer}>
              You&apos;re receiving this because you&apos;re watching {hostname}
              .{' '}
              <Link href={websiteUrl} style={link}>
                Click here to unwatch
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '100%',
  maxWidth: '600px'
};

const headerSection = {
  backgroundColor: '#fff',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
  padding: '32px 20px'
};

const section = {
  backgroundColor: '#fff',
  borderRadius: '0 0 8px 8px',
  padding: '0 20px 32px'
};

const h1 = {
  color: '#d32f2f',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  padding: '0'
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '24px 0 16px'
};

const subheading = {
  color: '#666',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  textAlign: 'center' as const
};

const statusCard = {
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0'
};

const statusTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0 0 12px'
};

const techListTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#333',
  margin: '16px 0 8px'
};

const techListItem = {
  fontSize: '14px',
  color: '#666',
  margin: '4px 0'
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0'
};

const actionCard = {
  backgroundColor: '#fff3e0',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0 24px',
  textAlign: 'left' as const
};

const actionTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#e65100',
  margin: '0 0 12px'
};

const questionCard = {
  backgroundColor: '#e3f2fd',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0 24px',
  textAlign: 'left' as const
};

const questionText = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1976d2',
  margin: '0 0 12px'
};

const bulletPoint = {
  fontSize: '14px',
  color: '#333',
  margin: '4px 0'
};

const primaryButton = {
  backgroundColor: '#1976d2',
  borderRadius: '5px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
  margin: '16px 0'
};

const paragraph = {
  color: '#444',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  margin: '16px 0'
};

const link = {
  color: '#1976d2',
  textDecoration: 'underline'
};

const whySection = {
  backgroundColor: '#fff3e0',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0'
};

const whyTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#e65100',
  margin: '0 0 8px'
};

const whyText = {
  fontSize: '14px',
  color: '#333',
  margin: '0',
  lineHeight: '20px'
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0'
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '24px 0 0'
};
