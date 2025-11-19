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
  if (!pattern) return true;
  if (pattern instanceof RegExp) return pattern.test(fileName);
  if (typeof pattern === 'string') return fileName.includes(pattern);
  if (typeof pattern === 'function') return pattern(fileName);
  return true;
}
