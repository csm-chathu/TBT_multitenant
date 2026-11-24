/**
 * Common constants used across the application for UI display and formatting.
 */

// Default empty/null value display
export const NOT_AVAILABLE = "N/A" as const;

// Text truncation constants
export const TRUNCATE_LENGTH = 70 as const;
export const TRUNCATE_SUFFIX = "..." as const;

/**
 * Truncates text to a specified length with a suffix
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation (default: TRUNCATE_LENGTH)
 * @param suffix - Suffix to append when truncated (default: TRUNCATE_SUFFIX)
 * @returns Truncated text with suffix if needed
 */
export const truncateText = (
  text: string,
  maxLength: number = TRUNCATE_LENGTH,
  suffix: string = TRUNCATE_SUFFIX
): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
};

