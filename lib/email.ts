// lib/email.ts
'use server';
// file for testing purposes primarily
import {
  ApartheidEmailAlert,
  EnhancedSecurityAlert,
  SecurityDigestEmail,
  SecurityStatusChangeAlert,
  TechnologyChangeAlert
} from '@/components/ApartheidEmailAlert';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendUnethicalSiteAlert(
  userEmail: string,
  userName: string,
  siteUrl: string
) {
  try {
    const result = await resend.emails.send({
      from: 'BWA <builtWithApartheid@resend.dev>',
      to: userEmail,
      subject: `Ethics Alert: ${siteUrl} flagged`,
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
    return result;
  } catch (error) {
    console.error(
      `Failed to send email to ${userEmail} ${userName} about ${siteUrl}`,
      error
    );
    // Implement retry logic or store failed attempts
  }
}

export async function sendTechnologyStackEmailAlert(
  userEmail: string,
  userName: string,
  siteUrl: string
) {
  try {
    const result = await resend.emails.send({
      from: 'BWA <builtWithApartheid@resend.dev>',
      to: userEmail,
      subject: `Ethics Alert: ${siteUrl} flagged`,
      react: TechnologyChangeAlert({
        siteUrl,
        userName,
        addedTechnologies: ['wix'],
        changeDate: new Date().toLocaleDateString(),
        removedTechnologies: [],
        unsubscribeUrl: ''
      })
    });
    return result;
  } catch (error) {
    console.error(
      `Failed to send email to ${userEmail} ${userName} about ${siteUrl}`,
      error
    );
    // Implement retry logic or store failed attempts
  }
}

export async function sendSecurityDigestEmailAlert(
  userEmail: string,
  userName: string,
  siteUrl: string
) {
  try {
    const result = await resend.emails.send({
      from: 'BWA <builtWithApartheid@resend.dev>',
      to: userEmail,
      subject: `Ethics Alert: ${siteUrl} flagged`,
      react: SecurityDigestEmail({
        // siteUrl,
        userName,
        // addedTechnologies: ['wix'],
        sites: [
          {
            url: 'djf',
            newVulnerabilities: 3,
            statusChanges: 1,
            lastScanDate: new Date().toLocaleDateString()
          }
        ],
        digestDate: new Date().toLocaleDateString(),
        // removedTechnologies: [],
        unsubscribeUrl: ''
      })
    });
    return result;
  } catch (error) {
    console.error(
      `Failed to send email to ${userEmail} ${userName} about ${siteUrl}`,
      error
    );
    // Implement retry logic or store failed attempts
  }
}

export async function sendSecurityStatusChangeAlert(
  userEmail: string,
  userName: string,
  siteUrl: string
) {
  try {
    const result = await resend.emails.send({
      from: 'BWA <builtWithApartheid@resend.dev>',
      to: userEmail,
      subject: `Ethics Alert: ${siteUrl} flagged`,
      react: SecurityStatusChangeAlert({
        siteUrl,
        userName,
        currentStatus: 'clean',
        previousStatus: 'infected',
        changeDate: new Date().toLocaleDateString(),
        statusChange: 'resolved',
        unsubscribeUrl: ''
      })
    });
    return result;
  } catch (error) {
    console.error(
      `Failed to send email to ${userEmail} ${userName} about ${siteUrl}`,
      error
    );
    // Implement retry logic or store failed attempts
  }
}

export async function sendEnhancedEmailAlert(
  userEmail: string,
  userName: string,
  siteUrl: string
) {
  try {
    const result = await resend.emails.send({
      from: 'BWA <builtWithApartheid@resend.dev>',
      to: userEmail,
      subject: `Ethics Alert: ${siteUrl} flagged`,
      react: EnhancedSecurityAlert({
        siteUrl,
        userName,
        // currentStatus: 'clean',
        // previousStatus: 'infected',
        // changeDate: new Date().toLocaleDateString(),
        // statusChange: 'resolved',
        unsubscribeUrl: ''
      })
    });
    return result;
  } catch (error) {
    console.error(
      `Failed to send email to ${userEmail} ${userName} about ${siteUrl}`,
      error
    );
    // Implement retry logic or store failed attempts
  }
}
