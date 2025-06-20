const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

function validateKvConfig(): void {
  if (!CF_API_TOKEN || !CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID) {
    throw new Error(
      'Cloudflare KV configuration missing. Required: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_KV_NAMESPACE_ID'
    );
  }
}

/**
 * Get a value from Cloudflare KV store
 */
export async function getKeyValue<T>(key: string): Promise<T | null> {
  validateKvConfig();

  const response = await fetch(
    `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(
      key
    )}`,
    {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`KV GET failed: ${response.status} ${response.statusText}`);
  }

  const value = await response.text();
  return JSON.parse(value) as T;
}

/**
 * Set a value in Cloudflare KV store
 */
export async function setKeyValue<T>(key: string, value: T): Promise<void> {
  validateKvConfig();

  const response = await fetch(
    `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(
      key
    )}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(value)
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(
      `KV PUT failed: ${response.status} ${response.statusText} - ${errorData}`
    );
  }
}

/**
 * Delete a key from Cloudflare KV store
 */
export async function deleteKey(key: string): Promise<void> {
  validateKvConfig();

  try {
    const response = await fetch(
      `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(
        key
      )}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`
        }
      }
    );

    if (!response.ok && response.status !== 404) {
      const errorData = await response.text();
      throw new Error(
        `KV DELETE failed: ${response.status} ${response.statusText} - ${errorData}`
      );
    }
  } catch (error) {
    console.error('Failed to delete KV key:', { key, error });
    throw error;
  }
}
