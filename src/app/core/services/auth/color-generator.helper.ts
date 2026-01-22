/**
 * Helper functions for generating user colors
 */

/**
 * Color palette for user avatars
 */
const USER_COLORS = [
  "#FF7A00",
  "#FF5EB3",
  "#6E52FF",
  "#9327FF",
  "#00BEE8",
  "#1FD7C1",
  "#FF745E",
  "#FFA35E",
  "#FC71FF",
  "#FFC701",
  "#0038FF",
  "#C3FF2B",
  "#FFE62B",
  "#FF4646",
  "#FFBB2B",
];

/**
 * Generates consistent color based on email address
 * @param email - User's email address
 * @returns Hexadecimal color code
 */
export function generateColorFromEmail(email: string): string {
  const hash = calculateEmailHash(email);
  const colorIndex = hash % USER_COLORS.length;
  return USER_COLORS[colorIndex];
}

/**
 * Calculates hash from email address
 * @param email - Email address to hash
 * @returns Numeric hash value
 */
function calculateEmailHash(email: string): number {
  return email
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
}
