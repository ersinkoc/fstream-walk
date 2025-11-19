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
  groupByExtension
} from '../src/helpers.js';

const TMP_DIR = path.join(os.tmpdir(), 'fstream-helpers-test-' + Date.now());

async function createTestStructure() {
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

async function cleanup() {
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
    const breakdown = await countFiles(TMP_DIR, { byExtension: true });
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
});
