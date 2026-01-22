/**
 * Helper functions for user profile data
 */

/**
 * Splits full name into first and last name
 * @param displayName - Full display name
 * @returns Object with firstName and lastName
 */
export function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const nameParts = displayName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  return { firstName, lastName };
}

/**
 * Generates initials from display name or email
 * @param displayName - Full display name
 * @param email - Email address as fallback
 * @returns Initials (max 2 characters)
 */
export function generateInitials(displayName: string, email?: string): string {
  if (displayName) {
    return extractInitialsFromName(displayName);
  }
  return extractInitialsFromEmail(email);
}

/**
 * Extracts initials from full name
 * @param name - Full display name
 * @returns Uppercase initials
 */
function extractInitialsFromName(name: string): string {
  return name
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Extracts initials from email address
 * @param email - Email address
 * @returns First 2 characters uppercase
 */
function extractInitialsFromEmail(email?: string): string {
  return email?.substring(0, 2).toUpperCase() || "U";
}

/**
 * Creates current timestamp in ISO format
 * @returns ISO timestamp string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
