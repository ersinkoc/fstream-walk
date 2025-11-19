import { Dirent, Stats } from 'fs';

/**
 * Configuration options for the directory walker
 */
export interface WalkerOptions {
  /**
   * Maximum depth to recurse into subdirectories
   * @default Infinity
   */
  maxDepth?: number;

  /**
   * Filter to include files/directories. Can be:
   * - string: Check if filename includes the string
   * - RegExp: Test filename against the pattern
   * - Function: Custom filter function that receives filename and returns boolean
   * @default null
   */
  include?: string | RegExp | ((fileName: string) => boolean) | null;

  /**
   * Filter to exclude files/directories. Can be:
   * - string: Check if filename includes the string
   * - RegExp: Test filename against the pattern
   * - Function: Custom filter function that receives filename and returns boolean
   * @default null
   */
  exclude?: string | RegExp | ((fileName: string) => boolean) | null;

  /**
   * Whether to yield directory paths in addition to files
   * @default false
   */
  yieldDirectories?: boolean;

  /**
   * Whether to follow symbolic links (Note: can cause infinite loops if circular)
   * @default false
   */
  followSymlinks?: boolean;

  /**
   * Whether to suppress errors like EACCES/EPERM (permission denied)
   * @default true
   */
  suppressErrors?: boolean;

  /**
   * AbortSignal to cancel the directory walk operation
   * @default null
   */
  signal?: AbortSignal | null;

  /**
   * Sort entries within each directory. Can be:
   * - 'asc': Sort alphabetically A-Z
   * - 'desc': Sort alphabetically Z-A
   * - Function: Custom comparator function (a, b) => number
   * @default null
   */
  sort?: 'asc' | 'desc' | ((a: Dirent, b: Dirent) => number) | null;

  /**
   * Callback function called for each yielded entry
   * Useful for progress tracking or side effects
   * @default null
   */
  onProgress?: ((entry: WalkerEntry) => void) | null;

  /**
   * Include fs.Stats object in yielded entries
   * This adds file size, timestamps, and other metadata
   * @default false
   */
  withStats?: boolean;
}

/**
 * Entry object yielded by the walker
 */
export interface WalkerEntry {
  /**
   * Absolute or relative path to the file/directory
   */
  path: string;

  /**
   * Directory entry object from fs.Dirent
   */
  dirent: Dirent;

  /**
   * Current depth level (0 = root directory)
   */
  depth: number;

  /**
   * File statistics (size, timestamps, etc.)
   * Only present if withStats option is true
   */
  stats?: Stats;
}

/**
 * Recursively walks a directory and yields file/directory entries
 *
 * @param dirPath - Root directory path to start walking from
 * @param options - Configuration options
 * @returns AsyncGenerator that yields WalkerEntry objects
 *
 * @example
 * ```typescript
 * import walker from 'fstream-walk';
 *
 * // List all JavaScript files
 * for await (const file of walker('./src', { include: /\.js$/ })) {
 *   console.log(file.path);
 * }
 *
 * // Limit depth and exclude patterns
 * for await (const file of walker('.', {
 *   maxDepth: 2,
 *   exclude: 'node_modules'
 * })) {
 *   console.log(file.path);
 * }
 *
 * // Use AbortSignal for cancellation
 * const controller = new AbortController();
 * for await (const file of walker('.', { signal: controller.signal })) {
 *   if (someCondition) controller.abort();
 * }
 * ```
 */
export default function walker(
  dirPath: string,
  options?: WalkerOptions
): AsyncGenerator<WalkerEntry, void, unknown>;
