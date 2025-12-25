import path from 'node:path';

/**
 * Joins paths (Cross-platform wrapper)
 */
export const joinPath = path.join;

/**
 * Checks if a filename matches a pattern.
 *
 * @param {string} fileName - The name of the file (not full path)
 * @param {string|RegExp|Function} pattern - The rule to match against
 * @returns {boolean}
 */
export function match(fileName, pattern) {
  // BUG-006 fixed: Only treat null and undefined as "match all"
  if (pattern === null || pattern === undefined) return true;

  // BUG-005 fixed: Validate pattern types
  if (pattern instanceof RegExp) return pattern.test(fileName);
  if (typeof pattern === 'string') {
    // BUG-006 fixed: Reject empty string as it's ambiguous
    if (pattern === '') {
      throw new TypeError('Pattern cannot be an empty string (use null for "match all")');
    }
    return fileName.includes(pattern);
  }
  if (typeof pattern === 'function') return pattern(fileName);

  // BUG-005 fixed: Throw error for invalid pattern types
  throw new TypeError(
    'Pattern must be a string, RegExp, function, null, or undefined. ' +
    `Got: ${typeof pattern}`
  );
}
