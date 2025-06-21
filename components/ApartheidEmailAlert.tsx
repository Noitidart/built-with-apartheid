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

// new more frightening email alert
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
              {`Here's your daily security summary for ${new Date().toLocaleDateString()}:`}
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

export const EnhancedSecurityAlert = ({
  siteUrl = 'example.com',
  userName = 'ethical user',
  severityLevel = 'Critical',
  vulnerabilityName = 'Israeli Technology',
  detectedTechnology = 'Wix',
  firstDetectedDate = new Date().toLocaleString(),
  activeUsers = 15420,
  scanCount = 847,
  recentChanges = 23,
  riskScore = 9.2,
  unsubscribeUrl = '#'
}) => {
  const getRiskColor = (score: number) => {
    if (score >= 9) return '#dc2626';
    if (score >= 7) return '#ea580c';
    return '#d97706';
  };

  const getSeverityStyles = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#ef4444',
          color: '#991b1b',
          borderWidth: '2px',
          borderStyle: 'solid'
        };
      case 'high':
        return {
          backgroundColor: '#fff7ed',
          borderColor: '#f97316',
          color: '#9a3412',
          borderWidth: '2px',
          borderStyle: 'solid'
        };
      case 'medium':
        return {
          backgroundColor: '#fefce8',
          borderColor: '#eab308',
          color: '#854d0e',
          borderWidth: '2px',
          borderStyle: 'solid'
        };
      default:
        return {
          backgroundColor: '#f9fafb',
          borderColor: '#6b7280',
          color: '#374151',
          borderWidth: '2px',
          borderStyle: 'solid'
        };
    }
  };

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Header - More Urgent */}
      <div
        style={{
          backgroundColor: '#dc2626',
          color: '#ffffff',
          padding: '24px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}
        >
          <span style={{ fontSize: '32px' }}>🚨</span>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0' }}>
            IMMEDIATE ACTION REQUIRED
          </h1>
        </div>
        <p style={{ color: '#fca5a5', fontSize: '18px', margin: '0' }}>
          Critical Security Breach Detected
        </p>
      </div>

      {/* Urgency Banner */}
      <div
        style={{
          backgroundColor: '#fef2f2',
          borderLeft: '4px solid #ef4444',
          padding: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>⏰</span>
          <div>
            <p
              style={{
                color: '#991b1b',
                fontWeight: 'bold',
                margin: '0 0 4px 0'
              }}
            >
              Time-Sensitive Alert
            </p>
            <p style={{ color: '#b91c1c', fontSize: '14px', margin: '0' }}>
              This vulnerability has been active for{' '}
              {Math.floor(
                (new Date().getTime() - new Date(firstDetectedDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              days and is currently being exploited
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '24px' }}>
        <p style={{ color: '#374151', marginBottom: '24px' }}>
          Hello {userName},
        </p>

        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}
        >
          <p
            style={{
              color: '#1f2937',
              fontWeight: '500',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}
          >
            <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
              {siteUrl}
            </span>{' '}
            - a site you&apos;re monitoring remains INFECTED with technology
            that is built on apartheid.
          </p>
          <p style={{ color: '#b91c1c', fontWeight: 'bold', margin: '0' }}>
            ⚠️ Your users and data are at immediate risk of compromise
          </p>
        </div>

        {/* Impact Metrics */}
        <div
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}
        >
          <h3
            style={{
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '12px',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '20px' }}>📈</span>
            Impact Analysis
          </h3>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '12px'
            }}
          >
            <tr>
              <td style={{ width: '50%', padding: '8px' }}>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>👥</span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Active Users at Risk
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#dc2626'
                    }}
                  >
                    {activeUsers.toLocaleString()}
                  </span>
                </div>
              </td>
              <td style={{ width: '50%', padding: '8px' }}>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🛡️</span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Risk Score
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: getRiskColor(riskScore)
                    }}
                  >
                    {riskScore}/10
                  </span>
                </div>
              </td>
            </tr>
          </table>

          <div
            style={{
              padding: '12px',
              backgroundColor: '#fefce8',
              border: '1px solid #fde047',
              borderRadius: '4px'
            }}
          >
            <p style={{ fontSize: '14px', color: '#854d0e', margin: '0' }}>
              <strong>{scanCount}</strong> security scans detected this
              vulnerability | <strong>{recentChanges}</strong> recent site
              changes may have worsened exposure
            </p>
          </div>
        </div>

        {/* Vulnerability Details */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}
        >
          <h3
            style={{
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '12px',
              fontSize: '18px',
              margin: '0 0 12px 0'
            }}
          >
            🔍 Vulnerability Details
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td
                style={{
                  padding: '8px 0',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Issue Type:
              </td>
              <td
                style={{
                  padding: '8px 0',
                  fontWeight: 'bold',
                  color: '#dc2626',
                  textAlign: 'right'
                }}
              >
                {vulnerabilityName}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td
                style={{
                  padding: '8px 0',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Affected Technology:
              </td>
              <td
                style={{
                  padding: '8px 0',
                  fontFamily: 'monospace',
                  color: '#1f2937',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  textAlign: 'right'
                }}
              >
                {detectedTechnology}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td
                style={{
                  padding: '8px 0',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Severity Level:
              </td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    ...getSeverityStyles(severityLevel)
                  }}
                >
                  {severityLevel.toUpperCase()}
                </span>
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '8px 0',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                First Detected:
              </td>
              <td
                style={{
                  padding: '8px 0',
                  color: '#1f2937',
                  textAlign: 'right'
                }}
              >
                {firstDetectedDate}
              </td>
            </tr>
          </table>
        </div>

        {/* Threat Level */}
        <div
          style={{
            backgroundColor: '#dc2626',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}
        >
          <h3
            style={{
              fontWeight: 'bold',
              marginBottom: '8px',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⚠️</span>
            Immediate Threats Identified
          </h3>
          <div style={{ fontSize: '14px', color: '#fca5a5' }}>
            <div style={{ marginBottom: '4px' }}>
              • Data breach and user information theft
            </div>
            <div style={{ marginBottom: '4px' }}>
              • Administrative access compromise
            </div>
            <div style={{ marginBottom: '4px' }}>
              • Malware injection and site defacement
            </div>
            <div style={{ marginBottom: '4px' }}>
              • SEO poisoning and search ranking damage
            </div>
            <div>• Legal liability and compliance violations</div>
          </div>
        </div>

        {/* Action Items */}
        <div
          style={{
            backgroundColor: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}
        >
          <h3
            style={{
              fontWeight: 'bold',
              color: '#9a3412',
              marginBottom: '12px',
              fontSize: '18px',
              margin: '0 0 12px 0'
            }}
          >
            ⚡ REQUIRED ACTIONS (Next 24 Hours)
          </h3>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '8px'
              }}
            >
              <span
                style={{
                  backgroundColor: '#f97316',
                  color: '#ffffff',
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                1
              </span>
              <span style={{ color: '#9a3412', fontWeight: '500' }}>
                Contact your development team immediately
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '8px'
              }}
            >
              <span
                style={{
                  backgroundColor: '#f97316',
                  color: '#ffffff',
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                2
              </span>
              <span style={{ color: '#9a3412', fontWeight: '500' }}>
                Implement emergency security patches
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '8px'
              }}
            >
              <span
                style={{
                  backgroundColor: '#f97316',
                  color: '#ffffff',
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                3
              </span>
              <span style={{ color: '#9a3412', fontWeight: '500' }}>
                Monitor for suspicious activity
              </span>
            </div>
            <div
              style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
            >
              <span
                style={{
                  backgroundColor: '#f97316',
                  color: '#ffffff',
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                4
              </span>
              <span style={{ color: '#9a3412', fontWeight: '500' }}>
                Consider temporarily disabling affected features
              </span>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <a
            href="#"
            style={{
              display: 'inline-block',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontWeight: 'bold',
              padding: '16px 32px',
              borderRadius: '8px',
              fontSize: '18px',
              textDecoration: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            🚨 SECURE YOUR SITE NOW
          </a>
          <p
            style={{
              color: '#6b7280',
              fontSize: '14px',
              marginTop: '8px',
              margin: '8px 0 0 0'
            }}
          >
            Every minute of delay increases your risk exposure
          </p>
        </div>

        {/* Footer Warning */}
        <div
          style={{
            backgroundColor: '#f3f4f6',
            borderLeft: '4px solid #9ca3af',
            padding: '16px',
            marginBottom: '16px'
          }}
        >
          <p style={{ color: '#374151', fontSize: '14px', margin: '0' }}>
            <strong>Delayed Response Risk:</strong> Vulnerabilities of this
            severity are typically exploited within 72 hours of detection.
            Immediate action is crucial to prevent data breach and system
            compromise.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '16px'
          }}
        >
          <p style={{ margin: '0 0 8px 0' }}>
            This is an automated security alert from your monitoring system.
          </p>
          <p style={{ margin: '0' }}>
            <a
              href={unsubscribeUrl}
              style={{ color: '#2563eb', textDecoration: 'underline' }}
            >
              Unsubscribe from alerts
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
