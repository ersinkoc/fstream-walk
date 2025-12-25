import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import walker from '../src/index.js';

// --- Test Setup ---
const TMP_DIR = path.join(os.tmpdir(), 'fstream-walk-edge-' + Date.now());

async function createEdgeCaseStructure(): Promise<void> {
  await fs.mkdir(TMP_DIR, { recursive: true });

  // Empty directory
  await fs.mkdir(path.join(TMP_DIR, 'empty-dir'));

  // Hidden files
  await fs.writeFile(path.join(TMP_DIR, '.hidden'), 'hidden content');
  await fs.writeFile(path.join(TMP_DIR, '.gitignore'), 'node_modules\n*.log');

  // Deep nesting
  let deepPath = TMP_DIR;
  for (let i = 0; i < 10; i++) {
    deepPath = path.join(deepPath, `level${i}`);
    await fs.mkdir(deepPath, { recursive: true });
  }
  await fs.writeFile(path.join(deepPath, 'deep.txt'), 'very deep file');

  // Special characters in filenames
  await fs.writeFile(path.join(TMP_DIR, 'file with spaces.txt'), 'content');
  await fs.writeFile(path.join(TMP_DIR, 'file-with-dashes.txt'), 'content');
  await fs.writeFile(path.join(TMP_DIR, 'file_with_underscores.txt'), 'content');

  // Multiple files with same extension
  for (let i = 0; i < 5; i++) {
    await fs.writeFile(path.join(TMP_DIR, `file${i}.js`), `content ${i}`);
  }

  // Mixed directory
  const mixedDir = path.join(TMP_DIR, 'mixed');
  await fs.mkdir(mixedDir);
  await fs.writeFile(path.join(mixedDir, 'README.md'), '# README');
  await fs.writeFile(path.join(mixedDir, 'index.js'), 'export default {}');
  await fs.writeFile(path.join(mixedDir, 'styles.css'), 'body {}');
  await fs.writeFile(path.join(mixedDir, 'config.json'), '{}');
}

async function cleanup(): Promise<void> {
  await fs.rm(TMP_DIR, { recursive: true, force: true });
}

// --- Edge Case Tests ---

describe('fstream-walk edge cases', () => {
  before(async () => await createEdgeCaseStructure());
  after(async () => await cleanup());

  test('should handle empty directories', async () => {
    const result: unknown[] = [];
    for await (const entry of walker(path.join(TMP_DIR, 'empty-dir'))) {
      result.push(entry);
    }
    assert.strictEqual(result.length, 0);
  });

  test('should find hidden files', async () => {
    const result: string[] = [];
    for await (const entry of walker(TMP_DIR, { maxDepth: 0, include: /^\./ })) {
      result.push(entry.path);
    }
    assert.ok(result.some(p => p.includes('.hidden')));
    assert.ok(result.some(p => p.includes('.gitignore')));
  });

  test('should handle deep directory nesting', async () => {
    const result: string[] = [];
    for await (const entry of walker(TMP_DIR, { include: 'deep.txt' })) {
      result.push(entry.path);
    }
    assert.strictEqual(result.length, 1);
    assert.ok(result[0].includes('deep.txt'));
  });

  test('should respect maxDepth with deep nesting', async () => {
    const result: string[] = [];
    for await (const entry of walker(TMP_DIR, { maxDepth: 2 })) {
      result.push(entry.path);
    }
    // Should not reach the deep.txt file at level 10
    assert.ok(!result.some(p => p.includes('deep.txt')));
  });

  test('should handle files with spaces in names', async () => {
    const result: string[] = [];
    for await (const entry of walker(TMP_DIR, { include: 'spaces', maxDepth: 0 })) {
      result.push(entry.path);
    }
    assert.strictEqual(result.length, 1);
    assert.ok(result[0].includes('file with spaces.txt'));
  });

  test('should handle files with special characters', async () => {
    const result: string[] = [];
    for await (const entry of walker(TMP_DIR, {
      maxDepth: 0,
      include: /file[-_]with/
    })) {
      result.push(entry.path);
    }
    assert.ok(result.length >= 2);
    assert.ok(result.some(p => p.includes('dashes')));
    assert.ok(result.some(p => p.includes('underscores')));
  });

  test('should handle multiple files with same extension', async () => {
    const result: string[] = [];
    for await (const entry of walker(TMP_DIR, {
      maxDepth: 0,
      include: /^file\d+\.js$/
    })) {
      result.push(entry.path);
    }
    assert.strictEqual(result.length, 5);
  });

  test('should filter with custom function', async () => {
    const result: string[] = [];
    const customFilter = (name: string): boolean => name.startsWith('file') && name.endsWith('.js');
    for await (const entry of walker(TMP_DIR, {
      maxDepth: 0,
      include: customFilter
    })) {
      result.push(entry.path);
    }
    assert.strictEqual(result.length, 5);
  });

  test('should handle both include and exclude filters together', async () => {
    const result: string[] = [];
    for await (const entry of walker(path.join(TMP_DIR, 'mixed'), {
      include: /\.(js|md)$/,
      exclude: 'README'
    })) {
      result.push(entry.path);
    }
    assert.strictEqual(result.length, 1);
    assert.ok(result[0].includes('index.js'));
  });

  test('should yield correct depth information', async () => {
    const result: Array<{ path: string; depth: number }> = [];
    for await (const entry of walker(TMP_DIR, { maxDepth: 2 })) {
      result.push({ path: entry.path, depth: entry.depth });
    }
    // Check that depth values are within expected range
    assert.ok(result.every(r => r.depth >= 0 && r.depth <= 2));
  });

  test('should handle directory with no matching files', async () => {
    const result: unknown[] = [];
    for await (const entry of walker(path.join(TMP_DIR, 'mixed'), {
      include: /\.xyz$/ // Non-existent extension
    })) {
      result.push(entry);
    }
    assert.strictEqual(result.length, 0);
  });

  test('should not include directories in results by default', async () => {
    for await (const entry of walker(TMP_DIR, { maxDepth: 1 })) {
      // All results should be files, not directories
      assert.ok(entry.dirent.isFile());
    }
  });

  test('should properly handle maxDepth of 0', async () => {
    for await (const entry of walker(TMP_DIR, { maxDepth: 0 })) {
      // Should only contain files from root level
      const relativePath = path.relative(TMP_DIR, entry.path);
      assert.ok(!relativePath.includes(path.sep));
    }
  });

  test('should work with relative paths', async () => {
    const result: string[] = [];
    for await (const entry of walker('.', {
      maxDepth: 0,
      include: 'package.json'
    })) {
      result.push(entry.path);
    }
    assert.ok(result.length >= 1);
  });

  test('should properly close directory handles on early exit', async () => {
    const result: unknown[] = [];
    for await (const entry of walker(TMP_DIR)) {
      result.push(entry);
      if (result.length === 3) break; // Early exit
    }
    assert.strictEqual(result.length, 3);
    // If handles weren't closed properly, we'd see errors
  });

  test('should handle very long file names', async () => {
    const longName = 'a'.repeat(200) + '.txt';
    const longPath = path.join(TMP_DIR, longName);
    await fs.writeFile(longPath, 'content');

    const result: string[] = [];
    for await (const entry of walker(TMP_DIR, {
      maxDepth: 0,
      include: longName
    })) {
      result.push(entry.path);
    }
    assert.strictEqual(result.length, 1);

    // Cleanup
    await fs.unlink(longPath);
  });
});
