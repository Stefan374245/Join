import { Auth } from '@angular/fire/auth';

/**
 * Gets authentication token from current user
 * @param auth - Firebase Auth instance
 * @returns Promise with auth token or null
 * @remarks Checks if a user is currently authenticated and retrieves their ID token. If no user is authenticated, it returns null. This token can be used for authenticated API requests to the backend.
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
 * @remarks If a token is provided, it adds an Authorization header with the Bearer token. It also includes an Accept header to specify that any response type is acceptable. This function standardizes the creation of headers for authenticated API requests.
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
 * @remarks Sets method to GET, mode to CORS, credentials to include, and adds auth headers if token is provided. This standardizes the fetch options for authenticated requests to the backend API.
 */
export function createAuthFetchOptions(token: string | null): RequestInit {
  return {
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
    headers: createAuthHeaders(token)
  };
}
