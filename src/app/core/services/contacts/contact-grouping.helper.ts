import { Contact } from '../../models/contact.interface';

/**
 * Interface for grouped contacts by initial letter
 */
export interface ContactGroup {
  letter: string;
  items: Contact[];
}

/**
 * Groups contacts by first letter of first name
 * @param contacts - Array of contacts to group
 * @returns Array of contact groups sorted by letter
 */
export function groupContactsByInitial(contacts: Contact[]): ContactGroup[] {
  const grouped = createGroupMap(contacts);
  return convertMapToSortedArray(grouped);
}

/**
 * Creates map of contacts grouped by initial
 * @param contacts - Array of contacts
 * @returns Map of initial letter to contacts
 */
function createGroupMap(contacts: Contact[]): Map<string, Contact[]> {
  const grouped = new Map<string, Contact[]>();
  
  contacts.forEach(contact => {
    const initial = extractInitial(contact);
    addContactToGroup(grouped, initial, contact);
  });
  
  return grouped;
}

/**
 * Extracts first letter from contact's first name
 * @param contact - Contact object
 * @returns Uppercase first letter
 */
function extractInitial(contact: Contact): string {
  return contact.firstName.charAt(0).toUpperCase();
}

/**
 * Adds contact to group in map
 * @param grouped - Map of grouped contacts
 * @param initial - Initial letter
 * @param contact - Contact to add
 */
function addContactToGroup(
  grouped: Map<string, Contact[]>,
  initial: string,
  contact: Contact
): void {
  if (!grouped.has(initial)) {
    grouped.set(initial, []);
  }
  grouped.get(initial)!.push(contact);
}

/**
 * Converts map to sorted array of contact groups
 * @param grouped - Map of grouped contacts
 * @returns Sorted array of contact groups
 */
function convertMapToSortedArray(grouped: Map<string, Contact[]>): ContactGroup[] {
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, items]) => ({ letter, items }));
}
