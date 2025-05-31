import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Text
} from '@react-email/components';

export function ApartheidEmailAlert({
  siteUrl,
  userName
}: {
  siteUrl: string;
  userName: string;
}) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Hello {userName},</Text>
          <Text>
            The website <Link href={siteUrl}>{siteUrl}</Link>{' '}
            {
              "You're watching has been flagged as unethical based on our criteria."
            }
          </Text>
          <Text>
            You may want to reconsider your association with this site.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
