/**
 * Sends email notifications to all watchers of a website when a new post is made.
 * The poster will not receive an email even if they are watching the website.
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
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components';

type TEmailNewPostToWatchersOptions = {
  prisma: PrismaClient;
  interactionId: number;
};

export async function emailNewPostToWatchers({
  prisma,
  interactionId
}: TEmailNewPostToWatchersOptions) {
  const postInteraction = await prisma.interaction.findUnique({
    where: { id: interactionId },
    select: {
      id: true,
      post: {
        select: {
          body: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true
            }
          },
          website: {
            select: {
              hostname: true,
              watchers: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!postInteraction?.post) {
    throw new Error(`No post found for interaction ${interactionId}`);
  }

  const { post } = postInteraction;
  const { website, user: poster } = post;

  // Get watcher emails, excluding the poster if they're watching
  const watcherEmails = website.watchers
    .filter(function isNotPoster(watcher) {
      return watcher.id !== poster.id;
    })
    .map(function getEmail(watcher) {
      return watcher.email;
    })
    .filter(function hasEmail(email): email is string {
      return email !== null;
    });

  if (watcherEmails.length === 0) {
    return;
  }

  // Prepare email data
  const emailProps = {
    websiteHostname: website.hostname,
    postContent: post.body,
    interactionId: postInteraction.id,
    posterEmail: poster.email || 'Anonymous',
    createdAt: post.createdAt
  };

  // Generate plain text version
  const postUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${website.hostname}#${postInteraction.id}`;
  const plainText = `New post on ${website.hostname}

A new post has been made on ${website.hostname}

Posted by: ${emailProps.posterEmail}
Date: ${new Date(emailProps.createdAt).toLocaleString()}

${post.body}

View Post: ${postUrl}

---

You are receiving this email because you are watching ${website.hostname}.
To stop receiving these notifications, visit the website and click "Unwatch".`;

  // Send emails to all watchers
  const result = await sendBulkEmail({
    to: watcherEmails,
    subject: `New post on ${website.hostname}`,
    react: NewPostEmail(emailProps),
    text: plainText
  });

  return {
    success: true,
    ...result
  };
}

type TNewPostEmailProps = {
  websiteHostname: string;
  postContent: string;
  interactionId: number;
  posterEmail: string;
  createdAt: Date;
};

function NewPostEmail({
  websiteHostname,
  postContent,
  interactionId,
  posterEmail,
  createdAt
}: TNewPostEmailProps) {
  const previewText = `New post on ${websiteHostname}`;
  const postUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${websiteHostname}#${interactionId}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New post on {websiteHostname}</Heading>

          <Section style={section}>
            <Text style={paragraph}>
              A new post has been made on{' '}
              <Link href={postUrl} style={link}>
                {websiteHostname}
              </Link>
            </Text>

            <Hr style={hr} />

            <Section style={postContainer}>
              <Text style={postMeta}>Posted by: {posterEmail}</Text>
              <Text style={postMeta}>
                {new Date(createdAt).toLocaleString()}
              </Text>
              <Text style={postContentStyle}>{postContent}</Text>
            </Section>

            <Hr style={hr} />

            <Text style={paragraph}>
              <Link href={postUrl} style={button}>
                View Post
              </Link>
            </Text>

            <Text style={footer}>
              You are receiving this email because you are watching{' '}
              {websiteHostname}. To stop receiving these notifications, visit
              the website and click &quot;Unwatch&quot;.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px'
};

const section = {
  padding: '0 48px'
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const
};

const paragraph = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'left' as const
};

const postContainer = {
  backgroundColor: '#f4f4f4',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0'
};

const postMeta = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px'
};

const postContentStyle = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  marginTop: '16px',
  whiteSpace: 'pre-wrap' as const
};

const link = {
  color: '#556cd6',
  textDecoration: 'underline'
};

const button = {
  backgroundColor: '#656ee8',
  borderRadius: '5px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '10px 20px',
  margin: '16px 0'
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0'
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '32px'
};
