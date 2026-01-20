/**
 * User color utilities for avatar and UI elements
 */

export const USER_COLORS = [
  '#FF7A00', // Orange
  '#9327FF', // Purple  
  '#6E52FF', // Blue
  '#FC71FF', // Pink
  '#FFBB2B', // Yellow
  '#1FD7C1', // Turquoise
  '#462F8A', // Dark Purple
  '#FF4646', // Red
] as const;

/**
 * Generate a consistent color for a user based on identifier
 * @param identifier - User ID or name to generate color from
 * @returns Hex color code
 */
export function getUserColorByIdentifier(identifier: string): string {
  const hash = identifier.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

/**
 * Extract initials from full name (max 2 characters)
 * @param name - Full name of user
 * @returns Uppercase initials
 */
export function getUserInitials(name: string): string {
  if (!name || name.trim().length === 0) return '??';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Convert hex color to CSS class name
 * @param hexColor - Hex color code (e.g., '#FF7A00')
 * @returns CSS class name (e.g., 'color-ff7a00')
 */
export function getUserColorClass(hexColor: string): string {
  return `color-${hexColor.replace('#', '').toLowerCase()}`;
}
