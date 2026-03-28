/**
 * Truncates a display name to a specified maximum length.
 * @param {string} name - The name to truncate.
 * @param {number} [maxLength=20] - Maximum allowed length before truncation.
 * @returns {string} The original string if within limit, truncated + "..." if over, or empty string for null/undefined.
 */
export function truncateName(name, maxLength = 20) {
  if (name == null) return "";
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + "...";
}
