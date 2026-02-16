/**
 * Constants for file upload and validation
 */

export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 15 * 1024 * 1024,
  MAX_FILES_PER_UPLOAD: 5,
  MAX_FILES_TOTAL: 10,
  MAX_ATTACHMENTS: 10,
  MAX_TOTAL_ATTACHMENTS_SIZE: 1 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png'] as const,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'] as const,
  
  MAGIC_BYTES: {
    JPEG: [0xFF, 0xD8, 0xFF],
    PNG: [0x89, 0x50, 0x4E, 0x47]
  }
} as const;

export const IMAGE_COMPRESSION = {
  MAX_DIMENSION: 800,
  QUALITY: 0.7,
  MAX_OUTPUT_SIZE: 1024 * 1024
} as const;

/**
 * Helper to format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Calculate actual size of base64 string in bytes
 * @param base64 - Base64 string (without data URL prefix)
 * @returns Size in bytes
 */
export function calculateBase64Size(base64: string): number {
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const padding = cleanBase64.endsWith('==') ? 2 : cleanBase64.endsWith('=') ? 1 : 0;
  
  return Math.floor((cleanBase64.length * 3) / 4) - padding;
}

/**
 * Calculate total size of all attachments in bytes
 * @param attachments - Array of attachments with base64 data
 * @returns Total size in bytes
 */
export function calculateTotalAttachmentsSize(attachments: { base64: string }[]): number {
  return attachments.reduce((total, att) => total + calculateBase64Size(att.base64), 0);
}
