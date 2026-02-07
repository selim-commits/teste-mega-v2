// src/lib/csrf.ts
// CSRF token utility for embed widgets.
// Generates a unique token per widget session and stores it in sessionStorage.
// The token is sent as an X-CSRF-Token header on all API requests from embed widgets.

const CSRF_STORAGE_KEY = 'rooom-csrf-token';

/**
 * Generate a cryptographically random CSRF token.
 */
function generateCsrfToken(): string {
  // Prefer crypto.randomUUID if available, otherwise fall back to getRandomValues
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: generate a hex string from random bytes
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the current CSRF token, or create one if it doesn't exist yet.
 * The token is stored in sessionStorage so it persists for the widget session
 * but is cleared when the tab/window is closed.
 */
export function getCsrfToken(): string {
  try {
    const existing = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (existing) {
      return existing;
    }
  } catch {
    // sessionStorage may be unavailable (e.g. in sandboxed iframes)
  }

  const token = generateCsrfToken();

  try {
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  } catch {
    // If sessionStorage is unavailable, the token will be regenerated on each call.
    // This is acceptable as the token is still sent with each request.
  }

  return token;
}

/**
 * Initialize the CSRF token eagerly. Call this in widget entry points
 * to ensure the token is ready before any API calls are made.
 */
export function initCsrfToken(): void {
  getCsrfToken();
}
