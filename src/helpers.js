import walker from './index.js';
import path from 'node:path';

/**
 * Find files matching a pattern
 * Returns an array of all matching file paths
 *
 * @param {string} dirPath - Directory to search
 * @param {Object} options - Walker options
 * @returns {Promise<string[]>} Array of file paths
 *
 * @example
 * const jsFiles = await findFiles('./src', { include: /\.js$/ });
 * console.log(jsFiles); // ['./src/index.js', './src/core.js', ...]
 */
export async function findFiles(dirPath, options = {}) {
  const files = [];
  for await (const entry of walker(dirPath, options)) {
    files.push(entry.path);
  }
  return files;
}

/**
 * Count files in a directory
 * Returns the total count and optional breakdown by extension
 *
 * @param {string} dirPath - Directory to count
 * @param {Object} options - Walker options + { byExtension: boolean }
 * @returns {Promise<number|Object>} Count or object with breakdown
 *
 * @example
 * const count = await countFiles('./src');
 * console.log(count); // 42
 *
 * const breakdown = await countFiles('./src', { byExtension: true });
 * console.log(breakdown); // { '.js': 10, '.ts': 5, total: 15 }
 */
export async function countFiles(dirPath, options = {}) {
  const { byExtension, ...walkerOptions } = options;

  if (byExtension) {
    const counts = { total: 0 };
    for await (const entry of walker(dirPath, walkerOptions)) {
      const ext = path.extname(entry.path) || '[no extension]';
      counts[ext] = (counts[ext] || 0) + 1;
      counts.total++;
    }
    return counts;
  }

  let count = 0;
  for await (const entry of walker(dirPath, walkerOptions)) {
    count++;
  }
  return count;
}

/**
 * Calculate total size of all files in a directory
 *
 * @param {string} dirPath - Directory to analyze
 * @param {Object} options - Walker options
 * @returns {Promise<Object>} Size information
 *
 * @example
 * const { totalSize, fileCount, averageSize } = await calculateSize('./src');
 * console.log(`Total: ${totalSize} bytes across ${fileCount} files`);
 */
export async function calculateSize(dirPath, options = {}) {
  let totalSize = 0;
  let fileCount = 0;

  for await (const entry of walker(dirPath, { ...options, withStats: true })) {
    if (entry.stats) {
      totalSize += entry.stats.size;
      fileCount++;
    }
  }

  return {
    totalSize,
    fileCount,
    averageSize: fileCount > 0 ? Math.round(totalSize / fileCount) : 0,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
  };
}

/**
 * Get largest files in a directory
 *
 * @param {string} dirPath - Directory to search
 * @param {Object} options - Walker options + { limit: number }
 * @returns {Promise<Array>} Array of {path, size} objects
 *
 * @example
 * const largest = await getLargestFiles('./src', { limit: 10 });
 * largest.forEach(f => console.log(`${f.path}: ${f.size} bytes`));
 */
export async function getLargestFiles(dirPath, options = {}) {
  const { limit = 10, ...walkerOptions } = options;
  const files = [];

  for await (const entry of walker(dirPath, { ...walkerOptions, withStats: true })) {
    if (entry.stats) {
      files.push({
        path: entry.path,
        size: entry.stats.size,
        sizeKB: (entry.stats.size / 1024).toFixed(2),
        modified: entry.stats.mtime
      });
    }
  }

  return files
    .sort((a, b) => b.size - a.size)
    .slice(0, limit);
}

/**
 * Find files modified after a specific date
 *
 * @param {string} dirPath - Directory to search
 * @param {Date|number} sinceDate - Date or timestamp
 * @param {Object} options - Walker options
 * @returns {Promise<Array>} Array of matching files
 *
 * @example
 * const yesterday = Date.now() - 24 * 60 * 60 * 1000;
 * const recent = await findRecentFiles('./src', yesterday);
 */
export async function findRecentFiles(dirPath, sinceDate, options = {}) {
  const timestamp = sinceDate instanceof Date ? sinceDate.getTime() : sinceDate;
  const files = [];

  for await (const entry of walker(dirPath, { ...options, withStats: true })) {
    if (entry.stats && entry.stats.mtime.getTime() > timestamp) {
      files.push({
        path: entry.path,
        modified: entry.stats.mtime,
        size: entry.stats.size
      });
    }
  }

  return files.sort((a, b) => b.modified - a.modified);
}

/**
 * Build a directory tree structure
 *
 * @param {string} dirPath - Root directory
 * @param {Object} options - Walker options
 * @returns {Promise<Object>} Nested tree object
 *
 * @example
 * const tree = await buildTree('./src');
 * console.log(JSON.stringify(tree, null, 2));
 */
export async function buildTree(dirPath, options = {}) {
  const tree = {};

  for await (const entry of walker(dirPath, { ...options, yieldDirectories: true })) {
    const relativePath = path.relative(dirPath, entry.path);
    const parts = relativePath.split(path.sep);

    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // Leaf node (file or empty directory)
        current[part] = entry.dirent.isDirectory() ? {} : null;
      } else {
        // Branch node
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }
  }

  return tree;
}

/**
 * Find duplicate files by name (ignoring path)
 *
 * @param {string} dirPath - Directory to search
 * @param {Object} options - Walker options
 * @returns {Promise<Object>} Map of filename to array of paths
 *
 * @example
 * const dupes = await findDuplicateNames('./src');
 * Object.entries(dupes).forEach(([name, paths]) => {
 *   if (paths.length > 1) {
 *     console.log(`Duplicate "${name}" found in:`, paths);
 *   }
 * });
 */
export async function findDuplicateNames(dirPath, options = {}) {
  const filesByName = {};

  for await (const entry of walker(dirPath, options)) {
    const filename = path.basename(entry.path);
    if (!filesByName[filename]) {
      filesByName[filename] = [];
    }
    filesByName[filename].push(entry.path);
  }

  // Filter to only duplicates
  const duplicates = {};
  for (const [name, paths] of Object.entries(filesByName)) {
    if (paths.length > 1) {
      duplicates[name] = paths;
    }
  }

  return duplicates;
}

/**
 * Search file contents for a pattern
 * Note: This reads files into memory, use carefully with large files
 *
 * @param {string} dirPath - Directory to search
 * @param {string|RegExp} pattern - Pattern to search for
 * @param {Object} options - Walker options
 * @returns {Promise<Array>} Array of {path, matches} objects
 *
 * @example
 * const matches = await searchInFiles('./src', /TODO:/);
 * matches.forEach(m => console.log(`${m.path}: ${m.matches.length} matches`));
 */
export async function searchInFiles(dirPath, pattern, options = {}) {
  const fs = await import('node:fs/promises');
  const results = [];
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : pattern;

  for await (const entry of walker(dirPath, options)) {
    try {
      const content = await fs.readFile(entry.path, 'utf-8');
      const matches = [...content.matchAll(regex)];

      if (matches.length > 0) {
        results.push({
          path: entry.path,
          matches: matches.map(m => ({
            text: m[0],
            index: m.index,
            line: content.substring(0, m.index).split('\n').length
          }))
        });
      }
    } catch (err) {
      // Skip files that can't be read as text
      if (options.suppressErrors !== false) continue;
      throw err;
    }
  }

  return results;
}

/**
 * Find empty directories
 *
 * @param {string} dirPath - Root directory to search
 * @param {Object} options - Walker options
 * @returns {Promise<string[]>} Array of empty directory paths
 *
 * @example
 * const empty = await findEmptyDirectories('./src');
 * console.log('Empty directories:', empty);
 */
export async function findEmptyDirectories(dirPath, options = {}) {
  const fs = await import('node:fs/promises');
  const emptyDirs = [];

  for await (const entry of walker(dirPath, { ...options, yieldDirectories: true })) {
    if (entry.dirent.isDirectory()) {
      try {
        const contents = await fs.readdir(entry.path);
        if (contents.length === 0) {
          emptyDirs.push(entry.path);
        }
      } catch (err) {
        // Skip if can't read directory
        if (options.suppressErrors !== false) continue;
        throw err;
      }
    }
  }

  return emptyDirs;
}

/**
 * Group files by extension
 *
 * @param {string} dirPath - Directory to analyze
 * @param {Object} options - Walker options
 * @returns {Promise<Object>} Map of extension to array of paths
 *
 * @example
 * const byExt = await groupByExtension('./src');
 * console.log('JS files:', byExt['.js'].length);
 */
export async function groupByExtension(dirPath, options = {}) {
  const groups = {};

  for await (const entry of walker(dirPath, options)) {
    const ext = path.extname(entry.path) || '[no extension]';
    if (!groups[ext]) {
      groups[ext] = [];
    }
    groups[ext].push(entry.path);
  }

  return groups;
}
