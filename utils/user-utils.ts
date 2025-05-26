import { customAlphabet } from 'nanoid';

// Speed: 1000 IDs per second
// ~125 years or 3T IDs needed, in order to have a 1% probability of at least one collision.
export const userNanoidGenerator = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  11
);

/**
 * Gets the current user ID from storage, or generates and stores a new one if none exists.
 * Uses localStorage with sessionStorage fallback for maximum persistence.
 */
export function getCurrentUserId(): string {
  const USER_ID_KEY = 'built-with-apartheid-user-id';

  // Try to get from localStorage first
  let storedUserId = null;
  try {
    storedUserId = localStorage.getItem(USER_ID_KEY);
  } catch (error) {
    console.warn('localStorage not available, trying sessionStorage:', error);
    try {
      storedUserId = sessionStorage.getItem(USER_ID_KEY);
    } catch (sessionError) {
      console.warn('sessionStorage also not available:', sessionError);
    }
  }

  if (storedUserId) {
    return storedUserId;
  }

  // Generate new user ID
  const newUserId = userNanoidGenerator();

  // Try to store in localStorage first, fallback to sessionStorage
  try {
    localStorage.setItem(USER_ID_KEY, newUserId);
  } catch (error) {
    console.warn(
      'Could not store in localStorage, trying sessionStorage:',
      error
    );
    try {
      sessionStorage.setItem(USER_ID_KEY, newUserId);
    } catch (sessionError) {
      console.warn('Could not store in sessionStorage either:', sessionError);
    }
  }

  return newUserId;
}
