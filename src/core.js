import fs from 'node:fs/promises';
import { joinPath, match } from './utils.js';

/**
 * Recursive Directory Walker Generator
 *
 * @param {string} dirPath
 * @param {Object} options
 * @param {number} currentDepth
 * @param {Set} visited - To prevent symlink loops
 */
export async function* walk(dirPath, options, currentDepth = 0, visited = new Set()) {
  // 1. Abort Check
  if (options.signal?.aborted) return;

  // 2. Depth Check
  if (currentDepth > options.maxDepth) return;

  // 3. Symlink Cycle Protection (only if following symlinks)
  if (options.followSymlinks) {
    try {
      const realPath = await fs.realpath(dirPath);
      if (visited.has(realPath)) return;
      visited.add(realPath);
    } catch (err) {
      // BUG-002 fixed: If we can't resolve realpath, add original path to visited
      // to prevent potential infinite loops with circular symlinks
      if (visited.has(dirPath)) return;
      visited.add(dirPath);

      // If we can't resolve path, proceed cautiously or skip based on policy
      if (!options.suppressErrors) throw err;
    }
  }

  let dirHandle;
  try {
    // opendir returns an AsyncIterable Dir object.
    // It buffers very little memory compared to readdir.
    dirHandle = await fs.opendir(dirPath);
  } catch (err) {
    if (!options.suppressErrors) throw err;
    return;
  }

  try {
    // BUG-001 fixed: Only collect entries into array if sorting is needed
    // This saves memory for large directories when sorting is disabled
    let entries;
    if (options.sort) {
      // Collect all entries for sorting
      entries = [];
      for await (const dirent of dirHandle) {
        if (options.signal?.aborted) break;
        entries.push(dirent);
      }
      sortEntries(entries, options.sort);
    } else {
      // For non-sorted iteration, create an async iterable wrapper
      entries = {
        [Symbol.asyncIterator]: () => dirHandle[Symbol.asyncIterator]()
      };
    }

    // Process entries (sorted array or streaming)
    for await (const dirent of entries) {
      if (options.signal?.aborted) break;

      const entryPath = joinPath(dirPath, dirent.name);

      // Determine if it's a directory (handle symlinks if needed)
      let isDirectory = dirent.isDirectory();

      if (dirent.isSymbolicLink() && options.followSymlinks) {
        try {
          const stats = await fs.stat(entryPath);
          isDirectory = stats.isDirectory();
        } catch (e) {
          isDirectory = false; // Broken link
        }
      }

      const isIncluded = applyFilters(dirent.name, options);

      if (isDirectory) {
        // If user wants directories yielded
        if (options.yieldDirectories && isIncluded) {
          const entry = { path: entryPath, dirent, depth: currentDepth };

          // Add stats if requested
          if (options.withStats) {
            try {
              entry.stats = await fs.stat(entryPath);
            } catch (e) {
              if (!options.suppressErrors) throw e;
            }
          }

          yield entry;

          // Progress callback
          if (options.onProgress) {
            options.onProgress(entry);
          }
        }
        // Recurse
        yield* walk(entryPath, options, currentDepth + 1, visited);
      } else {
        // It is a file
        if (isIncluded) {
          const entry = { path: entryPath, dirent, depth: currentDepth };

          // Add stats if requested
          if (options.withStats) {
            try {
              entry.stats = await fs.stat(entryPath);
            } catch (e) {
              if (!options.suppressErrors) throw e;
            }
          }

          yield entry;

          // Progress callback
          if (options.onProgress) {
            options.onProgress(entry);
          }
        }
      }
    }
  } catch (err) {
    if (!options.suppressErrors) throw err;
  } finally {
    // dirHandle closes automatically on loop finish,
    // but explicitly closing ensures cleanup on breaks/throws.
    if (dirHandle) {
      try {
        await dirHandle.close();
      } catch (e) {
        // Ignore errors if already closed
      }
    }
  }
}

/**
 * Logic for include/exclude precedence
 */
function applyFilters(name, options) {
  if (options.exclude && match(name, options.exclude)) return false;
  if (options.include && !match(name, options.include)) return false;
  return true;
}

/**
 * Sort directory entries
 * @param {Array} entries - Array of fs.Dirent objects
 * @param {string|Function} sortType - 'asc', 'desc', or custom comparator
 */
function sortEntries(entries, sortType) {
  if (typeof sortType === 'function') {
    entries.sort(sortType);
  } else if (sortType === 'asc') {
    entries.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortType === 'desc') {
    entries.sort((a, b) => b.name.localeCompare(a.name));
  }
}
