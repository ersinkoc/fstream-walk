export const DEFAULT_OPTIONS = {
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
 * Merges user options with defaults.
 * @param {Object} opts
 * @returns {Object}
 */
export function sanitizeOptions(opts = {}) {
  return { ...DEFAULT_OPTIONS, ...opts };
}
