export interface GlobOptions {
  /**
   * Include dotfiles in matches
   * @default false
   */
  dot?: boolean;

  /**
   * Case insensitive matching
   * @default false
   */
  nocase?: boolean;

  /**
   * Match basename only (ignore path)
   * @default false
   */
  matchBase?: boolean;
}

/**
 * Convert glob pattern to regular expression
 */
export function globToRegex(pattern: string): RegExp;

/**
 * Match a path against glob pattern(s)
 */
export function matchGlob(
  filePath: string,
  patterns: string | string[],
  options?: GlobOptions
): boolean;

/**
 * Create a filter function from glob patterns
 */
export function createGlobFilter(
  include: string | string[] | null,
  exclude: string | string[] | null,
  options?: GlobOptions
): (filePath: string) => boolean;

/**
 * Common glob patterns for convenience
 */
export const patterns: {
  javascript: string[];
  typescript: string[];
  web: string[];
  images: string[];
  documents: string[];
  nodeModules: string;
  dotfiles: string;
  tests: string[];
};
