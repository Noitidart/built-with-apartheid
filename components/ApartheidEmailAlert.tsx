import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Section,
  Text
} from '@react-email/components';

// New Vulnerability Alert Email
export function ApartheidEmailAlert({
  siteUrl,
  userName,
  vulnerabilityName,
  severityLevel,
  detectedTechnology,
  firstDetectedDate,
  unsubscribeUrl
}: {
  siteUrl: string;
  userName: string;
  vulnerabilityName: string;
  severityLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  detectedTechnology: string;
  firstDetectedDate: string;
  unsubscribeUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f6f8fa'
        }}
      >
        <Container style={{ padding: '20px', maxWidth: '600px' }}>
          <Section
            style={{
              backgroundColor: '#ffffff',
              padding: '32px',
              borderRadius: '8px',
              border: '1px solid #d1d9e0'
            }}
          >
            <Text
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#24292f',
                marginBottom: '16px'
              }}
            >
              🚨 {severityLevel} Security Vulnerability Detected
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#656d76',
                marginBottom: '20px'
              }}
            >
              Hello {userName},
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#24292f',
                marginBottom: '16px'
              }}
            >
              A <strong>{severityLevel.toLowerCase()}</strong> security
              vulnerability is still persistent on{' '}
              <Link
                href={siteUrl}
                style={{ color: '#0969da', textDecoration: 'none' }}
              >
                {siteUrl}
              </Link>
              , a site you&apos;re monitoring.
            </Text>

            <Section
              style={{
                backgroundColor: '#fff8f2',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #fd8c73',
                marginBottom: '20px'
              }}
            >
              <Text
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#7d2d00',
                  marginBottom: '8px'
                }}
              >
                Vulnerability Details:
              </Text>
              <Text
                style={{ fontSize: '14px', color: '#7d2d00', margin: '4px 0' }}
              >
                <strong>Issue:</strong> {vulnerabilityName}
              </Text>
              <Text
                style={{ fontSize: '14px', color: '#7d2d00', margin: '4px 0' }}
              >
                <strong>Technology:</strong> {detectedTechnology}
              </Text>
              <Text
                style={{ fontSize: '14px', color: '#7d2d00', margin: '4px 0' }}
              >
                <strong>Severity:</strong> {severityLevel}
              </Text>
              <Text
                style={{ fontSize: '14px', color: '#7d2d00', margin: '4px 0' }}
              >
                <strong>First Detected:</strong> {firstDetectedDate}
              </Text>
            </Section>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#24292f',
                marginBottom: '20px'
              }}
            >
              You may want to reconsider your association with this site or
              contact the site administrator about addressing this security
              concern.
            </Text>

            <Button
              href={siteUrl}
              style={{
                backgroundColor: '#0969da',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '20px'
              }}
            >
              View Site Details
            </Button>

            <Hr
              style={{
                border: 'none',
                borderTop: '1px solid #d1d9e0',
                margin: '24px 0'
              }}
            />

            <Text
              style={{ fontSize: '12px', color: '#656d76', lineHeight: '1.4' }}
            >
              $
              {
                "You're receiving this because you're watching security alerts for "
              }
              {siteUrl}.{' '}
              <Link
                href={unsubscribeUrl}
                style={{ color: '#0969da', textDecoration: 'none' }}
              >
                Unsubscribe from these notifications
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Security Status Change Email
export function SecurityStatusChangeAlert({
  siteUrl,
  userName,
  statusChange,
  previousStatus,
  currentStatus,
  changeDate,
  unsubscribeUrl
}: {
  siteUrl: string;
  userName: string;
  statusChange: 'improved' | 'degraded' | 'resolved';
  previousStatus: string;
  currentStatus: string;
  changeDate: string;
  unsubscribeUrl: string;
}) {
  const getStatusColor = (change: string) => {
    switch (change) {
      case 'improved':
        return '#1a7f37';
      case 'resolved':
        return '#1a7f37';
      case 'degraded':
        return '#cf222e';
      default:
        return '#656d76';
    }
  };

  const getStatusEmoji = (change: string) => {
    switch (change) {
      case 'improved':
        return '✅';
      case 'resolved':
        return '🎉';
      case 'degraded':
        return '⚠️';
      default:
        return '🔄';
    }
  };

  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f6f8fa'
        }}
      >
        <Container style={{ padding: '20px', maxWidth: '600px' }}>
          <Section
            style={{
              backgroundColor: '#ffffff',
              padding: '32px',
              borderRadius: '8px',
              border: '1px solid #d1d9e0'
            }}
          >
            <Text
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#24292f',
                marginBottom: '16px'
              }}
            >
              {getStatusEmoji(statusChange)} Security Status Update
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#656d76',
                marginBottom: '20px'
              }}
            >
              Hello {userName},
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#24292f',
                marginBottom: '16px'
              }}
            >
              The security status for{' '}
              <Link
                href={siteUrl}
                style={{ color: '#0969da', textDecoration: 'none' }}
              >
                {siteUrl}
              </Link>{' '}
              has been updated.
            </Text>

            <Section
              style={{
                backgroundColor:
                  statusChange === 'degraded' ? '#fff1f3' : '#f6ffed',
                padding: '16px',
                borderRadius: '6px',
                border: `1px solid ${statusChange === 'degraded' ? '#ffb3ba' : '#b7eb8f'}`,
                marginBottom: '20px'
              }}
            >
              <Text
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: getStatusColor(statusChange),
                  marginBottom: '8px'
                }}
              >
                Status Change Details:
              </Text>
              <Text
                style={{
                  fontSize: '14px',
                  color: getStatusColor(statusChange),
                  margin: '4px 0'
                }}
              >
                <strong>Previous Status:</strong> {previousStatus}
              </Text>
              <Text
                style={{
                  fontSize: '14px',
                  color: getStatusColor(statusChange),
                  margin: '4px 0'
                }}
              >
                <strong>Current Status:</strong> {currentStatus}
              </Text>
              <Text
                style={{
                  fontSize: '14px',
                  color: getStatusColor(statusChange),
                  margin: '4px 0'
                }}
              >
                <strong>Changed On:</strong> {changeDate}
              </Text>
            </Section>

            <Button
              href={siteUrl}
              style={{
                backgroundColor: '#0969da',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '20px'
              }}
            >
              View Current Status
            </Button>

            <Hr
              style={{
                border: 'none',
                borderTop: '1px solid #d1d9e0',
                margin: '24px 0'
              }}
            />

            <Text
              style={{ fontSize: '12px', color: '#656d76', lineHeight: '1.4' }}
            >
              {
                "You're receiving this because you're watching security updates for{' '}"
              }
              {siteUrl}.{' '}
              <Link
                href={unsubscribeUrl}
                style={{ color: '#0969da', textDecoration: 'none' }}
              >
                Unsubscribe from these notifications
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Daily Digest Email
export function SecurityDigestEmail({
  userName,
  sites,
  // digestDate,
  unsubscribeUrl
}: {
  userName: string;
  sites: Array<{
    url: string;
    newVulnerabilities: number;
    statusChanges: number;
    lastScanDate: string;
  }>;
  digestDate: string;
  unsubscribeUrl: string;
}) {
  const totalVulnerabilities = sites.reduce(
    (sum, site) => sum + site.newVulnerabilities,
    0
  );
  const totalChanges = sites.reduce((sum, site) => sum + site.statusChanges, 0);

  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f6f8fa'
        }}
      >
        <Container style={{ padding: '20px', maxWidth: '600px' }}>
          <Section
            style={{
              backgroundColor: '#ffffff',
              padding: '32px',
              borderRadius: '8px',
              border: '1px solid #d1d9e0'
            }}
          >
            <Text
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#24292f',
                marginBottom: '16px'
              }}
            >
              📊 Daily Security Digest
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#656d76',
                marginBottom: '20px'
              }}
            >
              Hello {userName},
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#24292f',
                marginBottom: '20px'
              }}
            >
              {"Here's your daily security summary for {digestDate}:"}
            </Text>

            {/* Summary Stats */}
            <Section
              style={{
                backgroundColor: '#f6f8fa',
                padding: '16px',
                borderRadius: '6px',
                marginBottom: '24px'
              }}
            >
              <Text
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#24292f',
                  marginBottom: '12px'
                }}
              >
                Summary
              </Text>
              <Text
                style={{ fontSize: '14px', color: '#24292f', margin: '4px 0' }}
              >
                • <strong>{totalVulnerabilities}</strong> new vulnerabilities
                detected
              </Text>
              <Text
                style={{ fontSize: '14px', color: '#24292f', margin: '4px 0' }}
              >
                • <strong>{totalChanges}</strong> security status changes
              </Text>
              <Text
                style={{ fontSize: '14px', color: '#24292f', margin: '4px 0' }}
              >
                • <strong>{sites.length}</strong> sites monitored
              </Text>
            </Section>

            {/* Site Details */}
            <Text
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#24292f',
                marginBottom: '16px'
              }}
            >
              Site Activity
            </Text>

            {sites.map((site, index) => (
              <Section
                key={index}
                style={{
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #d1d9e0'
                }}
              >
                <Text
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#0969da',
                    marginBottom: '8px'
                  }}
                >
                  <Link
                    href={site.url}
                    style={{ color: '#0969da', textDecoration: 'none' }}
                  >
                    {site.url}
                  </Link>
                </Text>

                {site.newVulnerabilities > 0 && (
                  <Text
                    style={{
                      fontSize: '12px',
                      color: '#cf222e',
                      margin: '2px 0'
                    }}
                  >
                    🚨 {site.newVulnerabilities} new vulnerability
                    {site.newVulnerabilities !== 1 ? 's' : ''}
                  </Text>
                )}

                {site.statusChanges > 0 && (
                  <Text
                    style={{
                      fontSize: '12px',
                      color: '#1a7f37',
                      margin: '2px 0'
                    }}
                  >
                    🔄 {site.statusChanges} status change
                    {site.statusChanges !== 1 ? 's' : ''}
                  </Text>
                )}

                <Text
                  style={{
                    fontSize: '12px',
                    color: '#656d76',
                    margin: '2px 0'
                  }}
                >
                  Last scanned: {site.lastScanDate}
                </Text>
              </Section>
            ))}

            <Hr
              style={{
                border: 'none',
                borderTop: '1px solid #d1d9e0',
                margin: '24px 0'
              }}
            />

            <Text
              style={{ fontSize: '12px', color: '#656d76', lineHeight: '1.4' }}
            >
              {
                "You're receiving this daily digest because you've subscribed to"
              }
              security updates.{' '}
              <Link
                href={unsubscribeUrl}
                style={{ color: '#0969da', textDecoration: 'none' }}
              >
                Unsubscribe from these notifications
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Technology Change Alert Email
export function TechnologyChangeAlert({
  siteUrl,
  userName,
  addedTechnologies,
  removedTechnologies,
  changeDate,
  unsubscribeUrl
}: {
  siteUrl: string;
  userName: string;
  addedTechnologies: string[];
  removedTechnologies: string[];
  changeDate: string;
  unsubscribeUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f6f8fa'
        }}
      >
        <Container style={{ padding: '20px', maxWidth: '600px' }}>
          <Section
            style={{
              backgroundColor: '#ffffff',
              padding: '32px',
              borderRadius: '8px',
              border: '1px solid #d1d9e0'
            }}
          >
            <Text
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#24292f',
                marginBottom: '16px'
              }}
            >
              🔧 Technology Stack Changes Detected
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#656d76',
                marginBottom: '20px'
              }}
            >
              Hello {userName},
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#24292f',
                marginBottom: '16px'
              }}
            >
              Changes to the technology stack have been detected on{' '}
              <Link
                href={siteUrl}
                style={{ color: '#0969da', textDecoration: 'none' }}
              >
                {siteUrl}
              </Link>
              .
            </Text>

            <Section
              style={{
                backgroundColor: '#f6f8fa',
                padding: '16px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}
            >
              <Text
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#24292f',
                  marginBottom: '12px'
                }}
              >
                Changes Detected on {changeDate}:
              </Text>

              {addedTechnologies.length > 0 && (
                <>
                  <Text
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#1a7f37',
                      marginBottom: '4px'
                    }}
                  >
                    ✅ Added Technologies:
                  </Text>
                  {addedTechnologies.map((tech, index) => (
                    <Text
                      key={index}
                      style={{
                        fontSize: '14px',
                        color: '#1a7f37',
                        margin: '2px 0 2px 16px'
                      }}
                    >
                      • {tech}
                    </Text>
                  ))}
                </>
              )}

              {removedTechnologies.length > 0 && (
                <>
                  <Text
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#cf222e',
                      marginBottom: '4px',
                      marginTop: '8px'
                    }}
                  >
                    ❌ Removed Technologies:
                  </Text>
                  {removedTechnologies.map((tech, index) => (
                    <Text
                      key={index}
                      style={{
                        fontSize: '14px',
                        color: '#cf222e',
                        margin: '2px 0 2px 16px'
                      }}
                    >
                      • {tech}
                    </Text>
                  ))}
                </>
              )}
            </Section>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#24292f',
                marginBottom: '20px'
              }}
            >
              {
                "Technology changes may affect the site's security profile.\nConsider reviewing the updated security scan results."
              }
            </Text>

            <Button
              href={siteUrl}
              style={{
                backgroundColor: '#0969da',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '20px'
              }}
            >
              View Updated Scan
            </Button>

            <Hr
              style={{
                border: 'none',
                borderTop: '1px solid #d1d9e0',
                margin: '24px 0'
              }}
            />

            <Text
              style={{ fontSize: '12px', color: '#656d76', lineHeight: '1.4' }}
            >
              {
                "You're receiving this because you're watching technology changes"
              }
              for {siteUrl}.{' '}
              <Link
                href={unsubscribeUrl}
                style={{ color: '#0969da', textDecoration: 'none' }}
              >
                Unsubscribe from these notifications
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
