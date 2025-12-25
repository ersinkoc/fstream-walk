import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import walker from '../src/index.js';

// --- Test Setup ---
const TMP_DIR = path.join(os.tmpdir(), 'fstream-walk-test-' + Date.now());

async function createStructure(): Promise<void> {
  await fs.mkdir(TMP_DIR, { recursive: true });
  await fs.writeFile(path.join(TMP_DIR, 'root.txt'), 'content');
  await fs.writeFile(path.join(TMP_DIR, 'image.png'), 'content');

  const sub1 = path.join(TMP_DIR, 'sub1');
  await fs.mkdir(sub1);
  await fs.writeFile(path.join(sub1, 'level1.js'), 'content');
  await fs.writeFile(path.join(sub1, 'ignored.log'), 'content');

  const sub2 = path.join(sub1, 'sub2');
  await fs.mkdir(sub2);
  await fs.writeFile(path.join(sub2, 'level2.js'), 'content');
}

async function cleanup(): Promise<void> {
  await fs.rm(TMP_DIR, { recursive: true, force: true });
}

// --- Tests ---

describe('fstream-walk', () => {

  before(async () => await createStructure());
  after(async () => await cleanup());

  test('should list all files recursively by default', async () => {
    const result: string[] = [];
    for await (const entry of walker(TMP_DIR)) {
      result.push(entry.path);
    }
    // root.txt, image.png, level1.js, ignored.log, level2.js
    assert.strictEqual(result.length, 5);
  });

  test('should respect maxDepth', async () => {
    const result: string[] = [];
    for await (const entry of walker(TMP_DIR, { maxDepth: 0 })) {
      result.push(entry.path);
    }
    // Should only see files in root (root.txt, image.png)
    assert.strictEqual(result.length, 2);
    assert.ok(result.some(p => p.includes('root.txt')));
    assert.ok(!result.some(p => p.includes('level1.js')));
  });

  test('should filter with include (RegExp)', async () => {
    const result: string[] = [];
    for await (const entry of walker(TMP_DIR, { include: /\.js$/ })) {
      result.push(entry.path);
    }
    assert.strictEqual(result.length, 2); // level1.js, level2.js
    assert.ok(result.every(p => p.endsWith('.js')));
  });

  test('should filter with exclude (String)', async () => {
    const result: string[] = [];
    for await (const entry of walker(TMP_DIR, { exclude: 'ignored' })) {
      result.push(entry.path);
    }
    assert.ok(!result.some(p => p.includes('ignored.log')));
    assert.ok(result.length > 0);
  });

  test('should yield directories when requested', async () => {
    const result: string[] = [];
    for await (const entry of walker(TMP_DIR, { yieldDirectories: true })) {
      if (entry.dirent.isDirectory()) result.push(entry.path);
    }
    assert.ok(result.some(p => p.endsWith('sub1')));
    assert.ok(result.some(p => p.endsWith('sub2')));
  });

  test('should support AbortSignal', async () => {
    const ac = new AbortController();
    const generator = walker(TMP_DIR, { signal: ac.signal });

    const result: unknown[] = [];
    try {
      for await (const entry of generator) {
        result.push(entry);
        ac.abort(); // Cancel after first item
      }
    } catch {
      // Some implementations might throw, ours just stops nicely or throws AbortError depending on timing
    }
    assert.strictEqual(result.length, 1);
  });

  test('should handle non-existent directory gracefully if errors suppressed', async () => {
    const results: unknown[] = [];
    for await (const entry of walker('./invalid-ghost-dir', { suppressErrors: true })) {
      results.push(entry);
    }
    assert.strictEqual(results.length, 0);
  });

  test('should throw error for non-existent directory if errors NOT suppressed', async () => {
    let errorThrown = false;
    try {
      for await (const _entry of walker('./invalid-ghost-dir', { suppressErrors: false })) {
        // noop
      }
    } catch {
      errorThrown = true;
    }
    assert.ok(errorThrown);
  });
});
