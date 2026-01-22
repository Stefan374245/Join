import { Timestamp } from '@angular/fire/firestore';
import { FirestoreTimestampInput } from '../../models/firestore-types.interface';

/**
 * Helper functions for contact timestamp conversions
 * Uses same pattern as task-timestamp.helper.ts for consistency
 */

/**
 * Converts various timestamp formats to Date object
 * @param timestamp - Timestamp in various formats
 * @returns JavaScript Date object
 */
export function convertToDate(timestamp: FirestoreTimestampInput): Date {
  if (!timestamp) {
    return new Date();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (isFirestoreTimestamp(timestamp)) {
    return timestamp.toDate();
  }
  if (isSecondsTimestamp(timestamp)) {
    return new Date(timestamp.seconds * 1000);
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  return new Date();
}

/**
 * Checks if value is Firestore Timestamp
 * @param value - Value to check
 * @returns True if Firestore Timestamp
 */
function isFirestoreTimestamp(value: unknown): value is Timestamp {
  return (
    typeof value === 'object' && 
    value !== null && 
    'toDate' in value && 
    typeof (value as any).toDate === 'function'
  );
}

/**
 * Checks if value has seconds property (Firestore timestamp object format)
 * @param value - Value to check
 * @returns True if has seconds property
 */
function isSecondsTimestamp(value: unknown): value is { seconds: number; nanoseconds?: number } {
  return (
    typeof value === 'object' && 
    value !== null && 
    'seconds' in value && 
    typeof (value as any).seconds === 'number'
  );
}

/**
 * Converts Date to Firestore Timestamp
 * @param date - JavaScript Date object
 * @returns Firestore Timestamp
 */
export function convertToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Gets current timestamp
 * @returns Current Date
 */
export function getCurrentDate(): Date {
  return new Date();
}
