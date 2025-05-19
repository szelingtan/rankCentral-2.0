/**
 * String utility functions
 */

/**
 * Sanitize a string for safe use in filenames or URLs
 * Removes/replaces invalid characters
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Remove invalid filename characters
  let sanitized = input.replace(/[^\w\s-]/g, '_');
  
  // Replace consecutive special chars with single one
  sanitized = sanitized.replace(/_{2,}/g, '_');
  
  // Trim whitespace and dashes from ends
  sanitized = sanitized.trim().replace(/^-+|-+$/g, '');
  
  return sanitized;
}