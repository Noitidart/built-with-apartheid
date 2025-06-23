import { deleteKey, getKeyValue, setKeyValue } from '@/lib/kv';

/**
 * Ban an IP address
 */
export async function banIp(ip: string): Promise<void> {
  const key = `banned_ip:${ip}`;
  await setKeyValue(key, true);
}

/**
 * Unban an IP address
 */
export async function unbanIp(ip: string): Promise<void> {
  const key = `banned_ip:${ip}`;
  await deleteKey(key);
}

/**
 * Check if an IP address is banned
 */
export async function isIpBanned(ip: string): Promise<boolean> {
  const key = `banned_ip:${ip}`;
  const banData = await getKeyValue<boolean>(key);
  return banData === true;
}

/**
 * Ban a user
 */
export async function banUser(userId: string): Promise<void> {
  const key = `banned_user:${userId}`;
  await setKeyValue(key, true);
}

/**
 * Unban a user
 */
export async function unbanUser(userId: string): Promise<void> {
  const key = `banned_user:${userId}`;
  await deleteKey(key);
}

/**
 * Check if a user is banned
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  const key = `banned_user:${userId}`;
  const banData = await getKeyValue<boolean>(key);
  return banData === true;
}
