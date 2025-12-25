import { walk } from './core.js';
import { sanitizeOptions } from './options.js';
import type { WalkerOptionsInput, WalkerEntry } from './options.js';

/**
 * Returns an AsyncIterable that yields files/directories from the target path.
 *
 * @param dirPath - Root directory to start scanning
 * @param options - Configuration object
 */
export default function streamWalker(
  dirPath: string,
  options: WalkerOptionsInput = {}
): AsyncGenerator<WalkerEntry, void, undefined> {
  const finalOptions = sanitizeOptions(options);
  return walk(dirPath, finalOptions);
}

// Re-export types for consumers
export type { WalkerOptions, WalkerOptionsInput, WalkerEntry, SortType } from './options.js';
export type { PatternType } from './utils.js';
