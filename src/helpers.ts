import walker from './index.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { WalkerOptionsInput } from './options.js';

/**
 * Find files matching a pattern
 * Returns an array of all matching file paths
 *
 * @example
 * const jsFiles = await findFiles('./src', { include: /\.js$/ });
 * console.log(jsFiles); // ['./src/index.js', './src/core.js', ...]
 */
export async function findFiles(dirPath: string, options: WalkerOptionsInput = {}): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of walker(dirPath, options)) {
    files.push(entry.path);
  }
  return files;
}

export interface CountFilesOptions extends WalkerOptionsInput {
  byExtension?: boolean;
}

export interface ExtensionBreakdown {
  [extension: string]: number;
  total: number;
}

/**
 * Count files in a directory
 * Returns the total count and optional breakdown by extension
 *
 * @example
 * const count = await countFiles('./src');
 * console.log(count); // 42
 *
 * const breakdown = await countFiles('./src', { byExtension: true });
 * console.log(breakdown); // { '.js': 10, '.ts': 5, total: 15 }
 */
export async function countFiles(dirPath: string, options: CountFilesOptions = {}): Promise<number | ExtensionBreakdown> {
  const { byExtension, ...walkerOptions } = options;

  if (byExtension) {
    const counts: ExtensionBreakdown = { total: 0 };
    for await (const entry of walker(dirPath, walkerOptions)) {
      const ext = path.extname(entry.path) || '[no extension]';
      counts[ext] = (counts[ext] || 0) + 1;
      counts.total++;
    }
    return counts;
  }

  let count = 0;
  for await (const _entry of walker(dirPath, walkerOptions)) {
    count++;
  }
  return count;
}

export interface SizeResult {
  totalSize: number;
  fileCount: number;
  averageSize: number;
  totalSizeKB: string;
  totalSizeMB: string;
}

/**
 * Calculate total size of all files in a directory
 *
 * @example
 * const { totalSize, fileCount, averageSize } = await calculateSize('./src');
 * console.log(`Total: ${totalSize} bytes across ${fileCount} files`);
 */
export async function calculateSize(dirPath: string, options: WalkerOptionsInput = {}): Promise<SizeResult> {
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

export interface LargestFilesOptions extends WalkerOptionsInput {
  limit?: number;
}

export interface FileInfo {
  path: string;
  size: number;
  sizeKB: string;
  modified: Date;
}

/**
 * Get largest files in a directory
 *
 * @example
 * const largest = await getLargestFiles('./src', { limit: 10 });
 * largest.forEach(f => console.log(`${f.path}: ${f.size} bytes`));
 */
export async function getLargestFiles(dirPath: string, options: LargestFilesOptions = {}): Promise<FileInfo[]> {
  const { limit = 10, ...walkerOptions } = options;
  const files: FileInfo[] = [];

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

export interface RecentFileInfo {
  path: string;
  modified: Date;
  size: number;
}

/**
 * Find files modified after a specific date
 *
 * @example
 * const yesterday = Date.now() - 24 * 60 * 60 * 1000;
 * const recent = await findRecentFiles('./src', yesterday);
 */
export async function findRecentFiles(
  dirPath: string,
  sinceDate: Date | number,
  options: WalkerOptionsInput = {}
): Promise<RecentFileInfo[]> {
  const timestamp = sinceDate instanceof Date ? sinceDate.getTime() : sinceDate;
  const files: RecentFileInfo[] = [];

  for await (const entry of walker(dirPath, { ...options, withStats: true })) {
    if (entry.stats && entry.stats.mtime.getTime() > timestamp) {
      files.push({
        path: entry.path,
        modified: entry.stats.mtime,
        size: entry.stats.size
      });
    }
  }

  return files.sort((a, b) => b.modified.getTime() - a.modified.getTime());
}

export interface TreeNode {
  [key: string]: TreeNode | null;
}

/**
 * Build a directory tree structure
 *
 * @example
 * const tree = await buildTree('./src');
 * console.log(JSON.stringify(tree, null, 2));
 */
export async function buildTree(dirPath: string, options: WalkerOptionsInput = {}): Promise<TreeNode> {
  const tree: TreeNode = {};

  for await (const entry of walker(dirPath, { ...options, yieldDirectories: true })) {
    const relativePath = path.relative(dirPath, entry.path);
    const parts = relativePath.split(path.sep);

    let current: TreeNode = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // Leaf node (file or empty directory)
        current[part] = entry.dirent.isDirectory() ? {} : null;
      } else {
        // Branch node
        if (!current[part]) current[part] = {};
        current = current[part] as TreeNode;
      }
    }
  }

  return tree;
}

export interface DuplicateFiles {
  [filename: string]: string[];
}

/**
 * Find duplicate files by name (ignoring path)
 *
 * @example
 * const dupes = await findDuplicateNames('./src');
 * Object.entries(dupes).forEach(([name, paths]) => {
 *   if (paths.length > 1) {
 *     console.log(`Duplicate "${name}" found in:`, paths);
 *   }
 * });
 */
export async function findDuplicateNames(dirPath: string, options: WalkerOptionsInput = {}): Promise<DuplicateFiles> {
  const filesByName: { [filename: string]: string[] } = {};

  for await (const entry of walker(dirPath, options)) {
    const filename = path.basename(entry.path);
    if (!filesByName[filename]) {
      filesByName[filename] = [];
    }
    filesByName[filename].push(entry.path);
  }

  // Filter to only duplicates
  const duplicates: DuplicateFiles = {};
  for (const [name, paths] of Object.entries(filesByName)) {
    if (paths.length > 1) {
      duplicates[name] = paths;
    }
  }

  return duplicates;
}

export interface SearchMatch {
  text: string;
  index: number;
  line: number;
}

export interface SearchResult {
  path: string;
  matches: SearchMatch[];
}

/**
 * Search file contents for a pattern
 * Note: This reads files into memory, use carefully with large files
 *
 * @example
 * const matches = await searchInFiles('./src', /TODO:/);
 * matches.forEach(m => console.log(`${m.path}: ${m.matches.length} matches`));
 */
export async function searchInFiles(
  dirPath: string,
  pattern: string | RegExp,
  options: WalkerOptionsInput = {}
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  // BUG-003 fixed: Ensure regex always has global flag for matchAll()
  let regex: RegExp;
  if (typeof pattern === 'string') {
    regex = new RegExp(pattern, 'g');
  } else if (pattern instanceof RegExp) {
    // If RegExp doesn't have global flag, create a new one with global flag
    regex = pattern.global ? pattern : new RegExp(pattern.source, pattern.flags + 'g');
  } else {
    regex = pattern as RegExp;
  }

  for await (const entry of walker(dirPath, options)) {
    try {
      const content = await fs.readFile(entry.path, 'utf-8');
      const matches = [...content.matchAll(regex)];

      if (matches.length > 0) {
        // BUG-008 fixed: Calculate line numbers efficiently
        // Instead of recalculating for each match, build a line index map
        const lineStarts: number[] = [0];
        for (let i = 0; i < content.length; i++) {
          if (content[i] === '\n') {
            lineStarts.push(i + 1);
          }
        }

        results.push({
          path: entry.path,
          matches: matches.map(m => {
            // Binary search to find line number
            let line = 1;
            const matchIndex = m.index ?? 0;
            for (let i = 0; i < lineStarts.length; i++) {
              if (lineStarts[i] > matchIndex) {
                line = i;
                break;
              }
              line = i + 1;
            }

            return {
              text: m[0],
              index: matchIndex,
              line: line
            };
          })
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
 * @example
 * const empty = await findEmptyDirectories('./src');
 * console.log('Empty directories:', empty);
 */
export async function findEmptyDirectories(dirPath: string, options: WalkerOptionsInput = {}): Promise<string[]> {
  const emptyDirs: string[] = [];

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

export interface GroupedFiles {
  [extension: string]: string[];
}

/**
 * Group files by extension
 *
 * @example
 * const byExt = await groupByExtension('./src');
 * console.log('JS files:', byExt['.js'].length);
 */
export async function groupByExtension(dirPath: string, options: WalkerOptionsInput = {}): Promise<GroupedFiles> {
  const groups: GroupedFiles = {};

  for await (const entry of walker(dirPath, options)) {
    const ext = path.extname(entry.path) || '[no extension]';
    if (!groups[ext]) {
      groups[ext] = [];
    }
    groups[ext].push(entry.path);
  }

  return groups;
}
