/**
 * User avatar color constants
 * These colors are used for user avatars throughout the application
 */
export const USER_COLORS = [
  '#FF7A00',
  '#FF5EB3',
  '#6E52FF',
  '#9327FF',
  '#00BEE8',
  '#1FD7C1',
  '#FF745E',
  '#FFA35E',
  '#FC71FF',
  '#FFC701',
  '#0038FF',
  '#C3FF2B',
  '#FFE62B',
  '#FF4646',
  '#FFBB2B'
] as const;

/**
 * Map of color names to hex values for CSS class generation
 */
export const USER_COLOR_MAP: Record<string, string> = {
  'FF7A00': '#FF7A00',
  'FF5EB3': '#FF5EB3',
  '6E52FF': '#6E52FF',
  '9327FF': '#9327FF',
  '00BEE8': '#00BEE8',
  '1FD7C1': '#1FD7C1',
  'FF745E': '#FF745E',
  'FFA35E': '#FFA35E',
  'FC71FF': '#FC71FF',
  'FFC701': '#FFC701',
  '0038FF': '#0038FF',
  'C3FF2B': '#C3FF2B',
  'FFE62B': '#FFE62B',
  'FF4646': '#FF4646',
  'FFBB2B': '#FFBB2B'
};

/**
 * Priority levels for tasks
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  URGENT = 'urgent'
}

/**
 * Priority color constants
 */
export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.LOW]: '#7AE229',
  [Priority.MEDIUM]: '#FFA800',
  [Priority.URGENT]: '#FF3D00'
};

/**
 * Get a user color by index
 * @param index - The index of the color in the USER_COLORS array
 * @returns The hex color value
 */
export function getUserColor(index: number): string {
  return USER_COLORS[index % USER_COLORS.length];
}

/**
 * Get a CSS class name for a user color
 * @param colorHex - The hex color value (with or without #)
 * @returns The CSS class name
 */
export function getUserColorClass(colorHex: string): string {
  const cleanHex = colorHex.replace('#', '').toUpperCase();
  return `userColor-${cleanHex}`;
}

/**
 * Generate a random user color
 * @returns A random color from USER_COLORS
 */
export function getRandomUserColor(): string {
  const randomIndex = Math.floor(Math.random() * USER_COLORS.length);
  return USER_COLORS[randomIndex];
}

/**
 * Get user color based on user ID or name (consistent color for same user)
 * @param identifier - User ID or name
 * @returns A consistent color for the given identifier
 */
export function getUserColorByIdentifier(identifier: string): string {
  // Simple hash function to get consistent color for same user
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

/**
 * Get user initials from full name
 * @param name - Full name of the user
 * @returns Initials (up to 2 characters)
 */
export function getUserInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Get priority color
 * @param priority - The priority level
 * @returns The hex color value for the priority
 */
export function getPriorityColor(priority: Priority): string {
  return PRIORITY_COLORS[priority];
}
