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
import { AlertTriangle, Clock, Shield, TrendingUp, Users } from 'lucide-react';
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

// new more frightening email alert
export const EnhancedSecurityAlert = ({
  siteUrl = 'example.com',
  userName = 'ethical user',
  severityLevel = 'Critical',
  vulnerabilityName = 'SQL Injection',
  detectedTechnology = 'PHP/MySQL',
  firstDetectedDate = new Date().toLocaleString(),
  activeUsers = 15420,
  scanCount = 847,
  recentChanges = 23,
  riskScore = 9.2,
  unsubscribeUrl = '#'
}) => {
  const getRiskColor = (score: number) => {
    if (score >= 9) return 'text-red-600';
    if (score >= 7) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getSeverityColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white font-sans">
      {/* Header - More Urgent */}
      <div className="bg-red-600 text-white p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
          <h1 className="text-2xl font-bold">🚨 IMMEDIATE ACTION REQUIRED</h1>
        </div>
        <p className="text-red-100 text-lg">
          Critical Security Breach Detected
        </p>
      </div>

      {/* Urgency Banner */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-red-800 font-semibold">Time-Sensitive Alert</p>
            <p className="text-red-700 text-sm">
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
      <div className="p-6">
        <p className="text-gray-700 mb-6">Hello {userName},</p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-gray-800 font-medium mb-2">
            A <span className="font-bold text-red-600">CRITICAL</span> security
            vulnerability remains unpatched on
            <span className="font-bold text-blue-600"> {siteUrl}</span> - a site
            you&apos;re monitoring.
          </p>
          <p className="text-red-700 font-semibold">
            ⚠️ Your users and data are at immediate risk of compromise
          </p>
        </div>

        {/* Impact Metrics - New Section */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            Impact Analysis
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">
                  Active Users at Risk
                </span>
              </div>
              <span className="text-2xl font-bold text-red-600">
                {activeUsers.toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Risk Score</span>
              </div>
              <span className={`text-2xl font-bold ${getRiskColor(riskScore)}`}>
                {riskScore}/10
              </span>
            </div>
          </div>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>{scanCount}</strong> security scans detected this
              vulnerability |<strong> {recentChanges}</strong> recent site
              changes may have worsened exposure
            </p>
          </div>
        </div>

        {/* Vulnerability Details - Enhanced */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-gray-800 mb-3 text-lg">
            🔍 Vulnerability Details
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Issue Type:</span>
              <span className="font-bold text-red-600">
                {vulnerabilityName}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">
                Affected Technology:
              </span>
              <span className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                {detectedTechnology}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Severity Level:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${getSeverityColor(severityLevel)}`}
              >
                {severityLevel.toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">First Detected:</span>
              <span className="text-gray-800">{firstDetectedDate}</span>
            </div>
          </div>
        </div>

        {/* Threat Level - New Section */}
        <div className="bg-red-600 text-white rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Immediate Threats Identified
          </h3>
          <ul className="space-y-1 text-sm text-red-100">
            <li>• Data breach and user information theft</li>
            <li>• Administrative access compromise</li>
            <li>• Malware injection and site defacement</li>
            <li>• SEO poisoning and search ranking damage</li>
            <li>• Legal liability and compliance violations</li>
          </ul>
        </div>

        {/* Action Items - More Urgent */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-orange-800 mb-3 text-lg">
            ⚡ REQUIRED ACTIONS (Next 24 Hours)
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold">
                1
              </span>
              <span className="text-orange-800 font-medium">
                Contact your development team immediately
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold">
                2
              </span>
              <span className="text-orange-800 font-medium">
                Implement emergency security patches
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold">
                3
              </span>
              <span className="text-orange-800 font-medium">
                Monitor for suspicious activity
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold">
                4
              </span>
              <span className="text-orange-800 font-medium">
                Consider temporarily disabling affected features
              </span>
            </div>
          </div>
        </div>

        {/* Call to Action - Enhanced */}
        <div className="text-center mb-6">
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-lg shadow-lg transition-colors">
            🚨 SECURE YOUR SITE NOW
          </button>
          <p className="text-gray-600 text-sm mt-2">
            Every minute of delay increases your risk exposure
          </p>
        </div>

        {/* Footer Warning */}
        <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mb-4">
          <p className="text-gray-700 text-sm">
            <strong>Delayed Response Risk:</strong> Vulnerabilities of this
            severity are typically exploited within 72 hours of detection.
            Immediate action is crucial to prevent data breach and system
            compromise.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm border-t pt-4">
          <p>
            This is an automated security alert from your monitoring system.
          </p>
          <p className="mt-2">
            <a href={unsubscribeUrl} className="text-blue-600 hover:underline">
              Unsubscribe from alerts
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
