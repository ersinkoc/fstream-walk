import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import walker from '../src/index.js';

const TMP_DIR = path.join(os.tmpdir(), 'fstream-core-test-' + Date.now());

async function createTestStructure(): Promise<void> {
  await fs.mkdir(TMP_DIR, { recursive: true });

  // Create test files in specific order
  await fs.writeFile(path.join(TMP_DIR, 'alpha.txt'), 'content alpha');
  await fs.writeFile(path.join(TMP_DIR, 'beta.txt'), 'content beta');
  await fs.writeFile(path.join(TMP_DIR, 'gamma.txt'), 'content gamma');

  const subDir = path.join(TMP_DIR, 'subdir');
  await fs.mkdir(subDir);
  await fs.writeFile(path.join(subDir, 'delta.txt'), 'content delta');
}

async function cleanup(): Promise<void> {
  await fs.rm(TMP_DIR, { recursive: true, force: true });
}

describe('Core Walker Functionality', () => {
  before(async () => await createTestStructure());
  after(async () => await cleanup());

  test('should include stats when withStats is true', async () => {
    const results = [];
    for await (const entry of walker(TMP_DIR, { withStats: true })) {
      results.push(entry);
    }

    assert.ok(results.length > 0);
    assert.ok(results.every(entry => entry.stats !== undefined));
    assert.ok(results.every(entry => typeof entry.stats?.size === 'number'));
    assert.ok(results.every(entry => entry.stats?.mtime instanceof Date));
  });

  test('should not include stats when withStats is false', async () => {
    const results = [];
    for await (const entry of walker(TMP_DIR, { withStats: false })) {
      results.push(entry);
    }

    assert.ok(results.length > 0);
    assert.ok(results.every(entry => entry.stats === undefined));
  });

  test('should call onProgress for each entry', async () => {
    const progressEntries: Array<{ path: string }> = [];
    const onProgress = (entry: { path: string }) => {
      progressEntries.push(entry);
    };

    const results = [];
    for await (const entry of walker(TMP_DIR, { onProgress })) {
      results.push(entry);
    }

    assert.strictEqual(progressEntries.length, results.length);
    assert.deepStrictEqual(
      progressEntries.map(e => e.path).sort(),
      results.map(e => e.path).sort()
    );
  });

  test('should call onProgress for directories when yieldDirectories is true', async () => {
    const progressDirs: string[] = [];
    const onProgress = (entry: { path: string; dirent: { isDirectory: () => boolean } }) => {
      if (entry.dirent.isDirectory()) {
        progressDirs.push(entry.path);
      }
    };

    for await (const _entry of walker(TMP_DIR, { onProgress, yieldDirectories: true })) {
      // Just iterate
    }

    assert.ok(progressDirs.length > 0);
    assert.ok(progressDirs.some(d => d.includes('subdir')));
  });

  test('should sort entries in ascending order when sort is asc', async () => {
    const results = [];
    for await (const entry of walker(TMP_DIR, { sort: 'asc', maxDepth: 0 })) {
      results.push(path.basename(entry.path));
    }

    // Check if sorted alphabetically
    const sorted = [...results].sort((a, b) => a.localeCompare(b));
    assert.deepStrictEqual(results, sorted);
  });

  test('should sort entries in descending order when sort is desc', async () => {
    const results = [];
    for await (const entry of walker(TMP_DIR, { sort: 'desc', maxDepth: 0 })) {
      results.push(path.basename(entry.path));
    }

    // Check if sorted in reverse alphabetically
    const sorted = [...results].sort((a, b) => b.localeCompare(a));
    assert.deepStrictEqual(results, sorted);
  });

  test('should use custom sort function', async () => {
    const results = [];
    // Sort by name length
    const customSort = (a: { name: string }, b: { name: string }) => a.name.length - b.name.length;

    for await (const entry of walker(TMP_DIR, { sort: customSort, maxDepth: 0 })) {
      results.push(path.basename(entry.path));
    }

    // Verify sorting by length
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i].length >= results[i - 1].length);
    }
  });

  test('should not sort when sort is null', async () => {
    const results = [];
    for await (const entry of walker(TMP_DIR, { sort: null })) {
      results.push(entry.path);
    }

    // Just verify we got results - order is filesystem dependent
    assert.ok(results.length > 0);
  });

  test('should yield directories with stats when both options are enabled', async () => {
    const dirEntries = [];
    for await (const entry of walker(TMP_DIR, { yieldDirectories: true, withStats: true })) {
      if (entry.dirent.isDirectory()) {
        dirEntries.push(entry);
      }
    }

    assert.ok(dirEntries.length > 0);
    assert.ok(dirEntries.every(entry => entry.stats !== undefined));
    assert.ok(dirEntries.every(entry => entry.stats?.isDirectory()));
  });

  test('should provide correct depth for all entries', async () => {
    const depthMap: Map<number, number> = new Map();

    for await (const entry of walker(TMP_DIR, { yieldDirectories: true })) {
      const count = depthMap.get(entry.depth) || 0;
      depthMap.set(entry.depth, count + 1);
    }

    // Should have entries at depth 0 and depth 1
    assert.ok(depthMap.has(0));
    assert.ok(depthMap.has(1));
  });

  test('should handle AbortSignal that is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const results = [];
    for await (const entry of walker(TMP_DIR, { signal: controller.signal })) {
      results.push(entry);
    }

    // Should not yield any entries when already aborted
    assert.strictEqual(results.length, 0);
  });

  test('should stop immediately when aborted during iteration', async () => {
    const controller = new AbortController();
    const results = [];

    for await (const entry of walker(TMP_DIR, { signal: controller.signal })) {
      results.push(entry);
      controller.abort();
    }

    // Should only get one entry before abort
    assert.strictEqual(results.length, 1);
  });
});
