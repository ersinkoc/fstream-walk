import { WalkerOptions } from './index.js';

export interface SizeInfo {
  totalSize: number;
  fileCount: number;
  averageSize: number;
  totalSizeKB: string;
  totalSizeMB: string;
}

export interface FileInfo {
  path: string;
  size: number;
  sizeKB: string;
  modified: Date;
}

export interface RecentFileInfo {
  path: string;
  modified: Date;
  size: number;
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
 * Find files matching a pattern
 */
export function findFiles(
  dirPath: string,
  options?: WalkerOptions
): Promise<string[]>;

/**
 * Count files in a directory
 */
export function countFiles(
  dirPath: string,
  options?: WalkerOptions & { byExtension?: boolean }
): Promise<number | Record<string, number>>;

/**
 * Calculate total size of all files
 */
export function calculateSize(
  dirPath: string,
  options?: WalkerOptions
): Promise<SizeInfo>;

/**
 * Get largest files in a directory
 */
export function getLargestFiles(
  dirPath: string,
  options?: WalkerOptions & { limit?: number }
): Promise<FileInfo[]>;

/**
 * Find files modified after a specific date
 */
export function findRecentFiles(
  dirPath: string,
  sinceDate: Date | number,
  options?: WalkerOptions
): Promise<RecentFileInfo[]>;

/**
 * Build a directory tree structure
 */
export function buildTree(
  dirPath: string,
  options?: WalkerOptions
): Promise<Record<string, any>>;

/**
 * Find duplicate files by name
 */
export function findDuplicateNames(
  dirPath: string,
  options?: WalkerOptions
): Promise<Record<string, string[]>>;

/**
 * Search file contents for a pattern
 */
export function searchInFiles(
  dirPath: string,
  pattern: string | RegExp,
  options?: WalkerOptions
): Promise<SearchResult[]>;

/**
 * Find empty directories
 */
export function findEmptyDirectories(
  dirPath: string,
  options?: WalkerOptions
): Promise<string[]>;

/**
 * Group files by extension
 */
export function groupByExtension(
  dirPath: string,
  options?: WalkerOptions
): Promise<Record<string, string[]>>;
