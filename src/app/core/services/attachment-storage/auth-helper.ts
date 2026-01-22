import { Auth } from '@angular/fire/auth';

/**
 * Helper functions for Firebase authentication operations
 */

/**
 * Gets authentication token from current user
 * @param auth - Firebase Auth instance
 * @returns Promise with auth token or null
 */
export async function getUserAuthToken(auth: Auth): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  return await user.getIdToken();
}

/**
 * Creates HTTP headers with authentication
 * @param token - Optional auth token
 * @returns Headers object with auth and accept headers
 */
export function createAuthHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Accept': '*/*',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Creates fetch options with authentication
 * @param token - Optional auth token
 * @returns Fetch RequestInit object
 */
export function createAuthFetchOptions(token: string | null): RequestInit {
  return {
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
    headers: createAuthHeaders(token)
  };
}
