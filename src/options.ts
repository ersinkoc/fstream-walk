import type { Dirent, Stats } from 'node:fs';
import type { PatternType } from './utils.js';

export interface WalkerEntry {
  path: string;
  dirent: Dirent;
  depth: number;
  stats?: Stats;
}

export type SortType = 'asc' | 'desc' | ((a: Dirent, b: Dirent) => number) | null;

export interface WalkerOptions {
  maxDepth: number;
  include: PatternType;
  exclude: PatternType;
  yieldDirectories: boolean;
  followSymlinks: boolean;
  suppressErrors: boolean;
  signal: AbortSignal | null;
  sort: SortType;
  onProgress: ((entry: WalkerEntry) => void) | null;
  withStats: boolean;
}

export interface WalkerOptionsInput {
  maxDepth?: number;
  include?: PatternType;
  exclude?: PatternType;
  yieldDirectories?: boolean;
  followSymlinks?: boolean;
  suppressErrors?: boolean;
  signal?: AbortSignal | null;
  sort?: SortType;
  onProgress?: ((entry: WalkerEntry) => void) | null;
  withStats?: boolean;
}

export const DEFAULT_OPTIONS: WalkerOptions = {
  maxDepth: Infinity,      // How deep to recurse
  include: null,           // Filter to include (String, Regex, Fn)
  exclude: null,           // Filter to exclude (String, Regex, Fn)
  yieldDirectories: false, // Should we yield directory paths too?
  followSymlinks: false,   // Dangerous: follow symlinks?
  suppressErrors: true,    // Ignore EACCES/EPERM errors
  signal: null,            // AbortSignal to cancel operation
  sort: null,              // Sort entries (null, 'asc', 'desc', or custom function)
  onProgress: null,        // Progress callback function
  withStats: false         // Include fs.Stats in yielded entries
};

/**
 * Merges user options with defaults and validates them.
 */
export function sanitizeOptions(opts: WalkerOptionsInput = {}): WalkerOptions {
  const merged: WalkerOptions = { ...DEFAULT_OPTIONS, ...opts };

  // BUG-004 fixed: Validate options

  // Validate maxDepth
  if (merged.maxDepth !== Infinity &&
      (typeof merged.maxDepth !== 'number' || isNaN(merged.maxDepth) || merged.maxDepth < 0)) {
    throw new Error('maxDepth must be a non-negative number or Infinity');
  }

  // BUG-007 fixed: Validate sort option
  if (merged.sort !== null &&
      merged.sort !== 'asc' &&
      merged.sort !== 'desc' &&
      typeof merged.sort !== 'function') {
    throw new Error("sort must be 'asc', 'desc', a function, or null");
  }

  // Validate signal
  if (merged.signal !== null && !(merged.signal instanceof AbortSignal)) {
    throw new Error('signal must be an AbortSignal or null');
  }

  // Validate boolean options
  if (typeof merged.yieldDirectories !== 'boolean') {
    throw new Error('yieldDirectories must be a boolean');
  }
  if (typeof merged.followSymlinks !== 'boolean') {
    throw new Error('followSymlinks must be a boolean');
  }
  if (typeof merged.suppressErrors !== 'boolean') {
    throw new Error('suppressErrors must be a boolean');
  }
  if (typeof merged.withStats !== 'boolean') {
    throw new Error('withStats must be a boolean');
  }

  // Validate onProgress callback
  if (merged.onProgress !== null && typeof merged.onProgress !== 'function') {
    throw new Error('onProgress must be a function or null');
  }

  return merged;
}
