/**
 * Helper functions for Base64 data formatting
 */

/**
 * Formats base64 string to data URL format
 * @param base64 - Base64 string with or without prefix
 * @param fileType - MIME type of the file
 * @returns Formatted data URL string
 */
export function formatBase64DataUrl(base64: string, fileType: string): string {
  if (base64.startsWith('data:')) {
    return base64;
  }
  return `data:${fileType};base64,${base64}`;
}

/**
 * Extracts base64 data without prefix
 * @param base64 - Base64 string with data URL prefix
 * @returns Pure base64 string
 */
export function extractBase64Data(base64: string): string {
  if (!base64.startsWith('data:')) {
    return base64;
  }
  const parts = base64.split(',');
  return parts.length > 1 ? parts[1] : base64;
}
