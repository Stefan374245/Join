/**
 * Constants for file upload and validation
 */

export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 1024 * 1024,
  MAX_FILES_PER_UPLOAD: 5,
  MAX_FILES_TOTAL: 10,
  MAX_ATTACHMENTS: 10,
  ALLOWED_TYPES: ['image/jpeg', 'image/png'] as const,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'] as const,
  
  MAGIC_BYTES: {
    JPEG: [0xFF, 0xD8, 0xFF],
    PNG: [0x89, 0x50, 0x4E, 0x47]
  }
} as const;

export const IMAGE_COMPRESSION = {
  MAX_DIMENSION: 800,
  QUALITY: 0.7
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
