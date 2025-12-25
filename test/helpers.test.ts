import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  findFiles,
  countFiles,
  calculateSize,
  getLargestFiles,
  findRecentFiles,
  buildTree,
  findDuplicateNames,
  groupByExtension,
  findEmptyDirectories,
  searchInFiles
} from '../src/helpers.js';
import type { ExtensionBreakdown } from '../src/helpers.js';

const TMP_DIR = path.join(os.tmpdir(), 'fstream-helpers-test-' + Date.now());

async function createTestStructure(): Promise<void> {
  await fs.mkdir(TMP_DIR, { recursive: true });

  // Create test files
  await fs.writeFile(path.join(TMP_DIR, 'file1.js'), 'content1');
  await fs.writeFile(path.join(TMP_DIR, 'file2.js'), 'content2 longer');
  await fs.writeFile(path.join(TMP_DIR, 'file3.txt'), 'content3');

  const subDir = path.join(TMP_DIR, 'subdir');
  await fs.mkdir(subDir);
  await fs.writeFile(path.join(subDir, 'file1.js'), 'duplicate name');
  await fs.writeFile(path.join(subDir, 'readme.md'), 'readme content');
}

async function cleanup(): Promise<void> {
  await fs.rm(TMP_DIR, { recursive: true, force: true });
}

describe('Helper Functions', () => {
  before(async () => await createTestStructure());
  after(async () => await cleanup());

  test('findFiles should return array of file paths', async () => {
    const files = await findFiles(TMP_DIR);
    assert.ok(Array.isArray(files));
    assert.strictEqual(files.length, 5);
  });

  test('findFiles with filter should return matching files', async () => {
    const jsFiles = await findFiles(TMP_DIR, { include: /\.js$/ });
    assert.strictEqual(jsFiles.length, 3);
    assert.ok(jsFiles.every(f => f.endsWith('.js')));
  });

  test('countFiles should return total count', async () => {
    const count = await countFiles(TMP_DIR);
    assert.strictEqual(count, 5);
  });

  test('countFiles with byExtension should return breakdown', async () => {
    const breakdown = await countFiles(TMP_DIR, { byExtension: true }) as ExtensionBreakdown;
    assert.strictEqual(breakdown['.js'], 3);
    assert.strictEqual(breakdown['.txt'], 1);
    assert.strictEqual(breakdown['.md'], 1);
    assert.strictEqual(breakdown.total, 5);
  });

  test('calculateSize should return size information', async () => {
    const sizeInfo = await calculateSize(TMP_DIR);
    assert.ok(sizeInfo.totalSize > 0);
    assert.strictEqual(sizeInfo.fileCount, 5);
    assert.ok(sizeInfo.averageSize > 0);
    assert.ok(sizeInfo.totalSizeKB);
    assert.ok(sizeInfo.totalSizeMB);
  });

  test('getLargestFiles should return sorted files', async () => {
    const largest = await getLargestFiles(TMP_DIR, { limit: 3 });
    assert.strictEqual(largest.length, 3);
    assert.ok(largest[0].size >= largest[1].size);
    assert.ok(largest[1].size >= largest[2].size);
  });

  test('findRecentFiles should find files after timestamp', async () => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    const recent = await findRecentFiles(TMP_DIR, yesterday);
    assert.ok(recent.length > 0);
    assert.ok(recent.every(f => f.modified.getTime() > yesterday));
  });

  test('buildTree should create directory structure', async () => {
    const tree = await buildTree(TMP_DIR);
    assert.ok(typeof tree === 'object');
    assert.ok('file1.js' in tree);
    assert.ok('subdir' in tree);
  });

  test('findDuplicateNames should find files with same name', async () => {
    const dupes = await findDuplicateNames(TMP_DIR);
    assert.ok('file1.js' in dupes);
    assert.strictEqual(dupes['file1.js'].length, 2);
  });

  test('groupByExtension should group files', async () => {
    const groups = await groupByExtension(TMP_DIR);
    assert.strictEqual(groups['.js'].length, 3);
    assert.strictEqual(groups['.txt'].length, 1);
    assert.strictEqual(groups['.md'].length, 1);
  });

  test('findEmptyDirectories should find empty dirs', async () => {
    const emptyDir = path.join(TMP_DIR, 'empty-test-dir');
    await fs.mkdir(emptyDir);

    const emptyDirs = await findEmptyDirectories(TMP_DIR);
    assert.ok(emptyDirs.some(d => d.includes('empty-test-dir')));

    // Cleanup
    await fs.rmdir(emptyDir);
  });

  test('findEmptyDirectories should not find non-empty dirs', async () => {
    const emptyDirs = await findEmptyDirectories(TMP_DIR);
    // subdir has files in it so should not be in the list
    assert.ok(!emptyDirs.some(d => d.endsWith('subdir') && !d.includes('empty')));
  });

  test('searchInFiles should find text matches', async () => {
    const results = await searchInFiles(TMP_DIR, 'content');
    assert.ok(results.length > 0);
    assert.ok(results.every(r => r.matches.length > 0));
  });

  test('searchInFiles should return correct line numbers', async () => {
    // Create a file with multiple lines
    const testFile = path.join(TMP_DIR, 'multiline.txt');
    await fs.writeFile(testFile, 'line1\nline2 MATCH\nline3\nline4 MATCH');

    const results = await searchInFiles(TMP_DIR, 'MATCH', { include: 'multiline.txt' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].matches.length, 2);
    assert.strictEqual(results[0].matches[0].line, 2);
    assert.strictEqual(results[0].matches[1].line, 4);

    // Cleanup
    await fs.unlink(testFile);
  });

  test('searchInFiles with string pattern should work', async () => {
    const results = await searchInFiles(TMP_DIR, 'duplicate');
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].path.includes('file1.js'));
  });

  test('findRecentFiles should accept Date object', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await findRecentFiles(TMP_DIR, yesterday);
    assert.ok(recent.length > 0);
  });

  test('getLargestFiles should use default limit of 10', async () => {
    const largest = await getLargestFiles(TMP_DIR);
    assert.ok(largest.length <= 10);
  });

  test('calculateSize should return 0 averageSize for empty directory', async () => {
    const emptyDir = path.join(TMP_DIR, 'empty-size-test');
    await fs.mkdir(emptyDir);

    const sizeInfo = await calculateSize(emptyDir);
    assert.strictEqual(sizeInfo.fileCount, 0);
    assert.strictEqual(sizeInfo.averageSize, 0);

    await fs.rmdir(emptyDir);
  });

  test('buildTree should handle files without extension', async () => {
    const noExtFile = path.join(TMP_DIR, 'noextension');
    await fs.writeFile(noExtFile, 'no extension content');

    const tree = await buildTree(TMP_DIR);
    assert.ok('noextension' in tree);
    assert.strictEqual(tree['noextension'], null);

    await fs.unlink(noExtFile);
  });

  test('countFiles should handle files without extension', async () => {
    const noExtFile = path.join(TMP_DIR, 'noextfile');
    await fs.writeFile(noExtFile, 'content');

    const breakdown = await countFiles(TMP_DIR, { byExtension: true }) as ExtensionBreakdown;
    assert.ok(breakdown['[no extension]'] >= 1);

    await fs.unlink(noExtFile);
  });

  test('groupByExtension should handle files without extension', async () => {
    const noExtFile = path.join(TMP_DIR, 'noextgroupfile');
    await fs.writeFile(noExtFile, 'content');

    const groups = await groupByExtension(TMP_DIR);
    assert.ok('[no extension]' in groups);

    await fs.unlink(noExtFile);
  });
});
