import { walk } from './core.js';
import { sanitizeOptions } from './options.js';

/**
 * Returns an AsyncIterable that yields files/directories from the target path.
 *
 * @param {string} dirPath - Root directory to start scanning
 * @param {Object} options - Configuration object
 * @returns {AsyncGenerator<{path: string, dirent: fs.Dirent, depth: number}>}
 */
export default function streamWalker(dirPath, options = {}) {
  const finalOptions = sanitizeOptions(options);
  return walk(dirPath, finalOptions);
}
