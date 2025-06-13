/**
 * Safely gets a value from localStorage with sessionStorage fallback
 * 
 * Storage fallback hierarchy:
 * 1. localStorage (preferred) - persistent across sessions, survives browser restarts
 * 2. sessionStorage (fallback) - persistent within tab session, survives page refreshes
 * 3. null (worst case) - when storage is completely unavailable
 * 
 * Fallback is needed for private/incognito mode, storage quotas, browser extensions,
 * and enterprise policies that may disable localStorage.
 */
export function getFromStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('localStorage not available, trying sessionStorage:', error);
    try {
      return sessionStorage.getItem(key);
    } catch (sessionError) {
      console.warn('sessionStorage also not available:', sessionError);
      return null;
    }
  }
}

/**
 * Safely sets a value in localStorage with sessionStorage fallback
 * 
 * Storage fallback hierarchy:
 * 1. localStorage (preferred) - persistent across sessions for better user experience
 * 2. sessionStorage (fallback) - at least preserves identity during current tab session
 * 
 * This graceful degradation ensures the site works for 99.9% of users while providing
 * the best possible experience based on their browser capabilities.
 */
export function setInStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(
      'Could not store in localStorage, trying sessionStorage:',
      error
    );
    try {
      sessionStorage.setItem(key, value);
    } catch (sessionError) {
      console.warn('Could not store in sessionStorage either:', sessionError);
    }
  }
}

/**
 * Safely removes a value from localStorage with sessionStorage fallback
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Could not remove from localStorage, trying sessionStorage:', error);
    try {
      sessionStorage.removeItem(key);
    } catch (sessionError) {
      console.warn('Could not remove from sessionStorage either:', sessionError);
    }
  }
}