/**
 * Normalizes a label/name string to a consistent format
 * Converts to lowercase, trims whitespace, and handles special characters
 * Similar to the old sails.helpers.util.getName
 */
export function normalizeName(label: string): string {
  if (!label || typeof label !== 'string') {
    return '';
  }
  
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .trim();
}

