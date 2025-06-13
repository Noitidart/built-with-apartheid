export function getNormalizedHostname(
  /** Does not have to start with http or https */
  url: string
): string {
  const urlInstance = new URL(ensureHttpProtocol(url));
  const normalizedHostname = urlInstance.hostname
    .toLowerCase()
    .replace('www.', '');

  return normalizedHostname;
}

export function ensureHttpProtocol(url: string): string {
  if (url.startsWith('http')) {
    return url;
  }

  return `https://${url}`;
}
