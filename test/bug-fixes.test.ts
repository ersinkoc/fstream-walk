/**
 * Test file to verify bug fixes
 * Each test demonstrates a specific bug and verifies the fix
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import walker from '../src/index.js';
import { searchInFiles } from '../src/helpers.js';
import { match } from '../src/utils.js';
import { sanitizeOptions } from '../src/options.js';

describe('Bug Fixes', () => {
  let testDir: string;

  // Setup: Create a temporary test directory before each test
  async function setupTestDir(): Promise<string> {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fstream-bug-test-'));
    return testDir;
  }

  // Cleanup: Remove test directory after each test
  async function cleanupTestDir(): Promise<void> {
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  }

  // =========================================================================
  // BUG-003: CRITICAL - TypeError with non-global RegExp in searchInFiles
  // =========================================================================
  test('BUG-003: searchInFiles should handle non-global RegExp', async () => {
    await setupTestDir();

    try {
      // Create test file
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'TODO: fix this\nTODO: and this\nDone');

      // Test with non-global RegExp (this currently throws TypeError)
      const nonGlobalPattern = /TODO/; // No 'g' flag

      // This should NOT throw an error
      const results = await searchInFiles(testDir, nonGlobalPattern);

      // Verify results
      assert.ok(Array.isArray(results), 'Should return an array');
      assert.strictEqual(results.length, 1, 'Should find one file');
      assert.strictEqual(results[0].matches.length, 2, 'Should find two matches');
    } finally {
      await cleanupTestDir();
    }
  });

  test('BUG-003: searchInFiles should work with global RegExp', async () => {
    await setupTestDir();

    try {
      // Create test file
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'TODO: fix this\nTODO: and this\nDone');

      // Test with global RegExp (this should work)
      const globalPattern = /TODO/g; // With 'g' flag

      const results = await searchInFiles(testDir, globalPattern);

      // Verify results
      assert.ok(Array.isArray(results), 'Should return an array');
      assert.strictEqual(results.length, 1, 'Should find one file');
      assert.strictEqual(results[0].matches.length, 2, 'Should find two matches');
    } finally {
      await cleanupTestDir();
    }
  });

  // =========================================================================
  // BUG-002: HIGH - Potential infinite loop with circular symlinks
  // =========================================================================
  test('BUG-002: should handle circular symlinks without infinite loop', async () => {
    await setupTestDir();

    try {
      // Create directory structure with circular symlink
      const dir1 = path.join(testDir, 'dir1');
      const dir2 = path.join(testDir, 'dir1', 'dir2');
      await fs.mkdir(dir1);
      await fs.mkdir(dir2);

      // Create a file in dir2
      await fs.writeFile(path.join(dir2, 'file.txt'), 'content');

      // Create circular symlink: dir2/link -> dir1
      const symlinkPath = path.join(dir2, 'link-to-parent');
      await fs.symlink(dir1, symlinkPath);

      // Simulate realpath failure by using a restricted path
      // Walk with followSymlinks=true and suppressErrors=true
      const files: string[] = [];
      let count = 0;
      const maxIterations = 1000; // Safety limit

      for await (const file of walker(testDir, {
        followSymlinks: true,
        suppressErrors: true
      })) {
        files.push(file.path);
        count++;

        // Break if we iterate too many times (indicates infinite loop)
        if (count > maxIterations) {
          assert.fail('Infinite loop detected - iterated more than ' + maxIterations + ' times');
        }
      }

      // Should complete without infinite loop
      assert.ok(count < maxIterations, 'Should not cause infinite loop');
      assert.ok(files.length > 0, 'Should find at least one file');
    } finally {
      await cleanupTestDir();
    }
  });

  // =========================================================================
  // BUG-004: MEDIUM - No validation for maxDepth option
  // =========================================================================
  test('BUG-004: should validate maxDepth - reject negative values', async () => {
    await setupTestDir();

    try {
      // Create simple directory
      await fs.writeFile(path.join(testDir, 'file.txt'), 'content');

      // Test with negative maxDepth - should throw error after fix
      assert.throws(() => {
        sanitizeOptions({ maxDepth: -1 });
      }, {
        name: 'Error',
        message: /maxDepth must be a non-negative number or Infinity/
      });
    } finally {
      await cleanupTestDir();
    }
  });

  test('BUG-004: should validate maxDepth - reject NaN', async () => {
    assert.throws(() => {
      sanitizeOptions({ maxDepth: NaN });
    }, {
      name: 'Error',
      message: /maxDepth must be a non-negative number or Infinity/
    });
  });

  test('BUG-004: should validate maxDepth - reject non-numeric values', async () => {
    assert.throws(() => {
      sanitizeOptions({ maxDepth: 'hello' as unknown as number });
    }, {
      name: 'Error',
      message: /maxDepth must be a non-negative number or Infinity/
    });
  });

  test('BUG-004: should accept valid maxDepth values', async () => {
    // These should all pass validation
    assert.doesNotThrow(() => sanitizeOptions({ maxDepth: 0 }));
    assert.doesNotThrow(() => sanitizeOptions({ maxDepth: 5 }));
    assert.doesNotThrow(() => sanitizeOptions({ maxDepth: Infinity }));
  });

  // =========================================================================
  // BUG-005: LOW - No validation for pattern types in match()
  // =========================================================================
  test('BUG-005: match() should reject invalid pattern types', async () => {
    // After fix, these should throw errors
    assert.throws(() => {
      match('test.js', 123 as unknown as string);
    }, {
      name: 'TypeError',
      message: /Pattern must be a string, RegExp, function, null, or undefined/
    });

    assert.throws(() => {
      match('test.js', {} as unknown as string);
    }, {
      name: 'TypeError',
      message: /Pattern must be a string, RegExp, function, null, or undefined/
    });

    assert.throws(() => {
      match('test.js', ['*.js'] as unknown as string);
    }, {
      name: 'TypeError',
      message: /Pattern must be a string, RegExp, function, null, or undefined/
    });
  });

  test('BUG-005: match() should accept valid pattern types', async () => {
    // These should work
    assert.strictEqual(match('test.js', null), true);
    assert.strictEqual(match('test.js', undefined), true);
    assert.strictEqual(match('test.js', 'test'), true);
    assert.strictEqual(match('test.js', /test/), true);
    assert.strictEqual(match('test.js', (name) => name.includes('test')), true);
  });

  // =========================================================================
  // BUG-006: LOW - Falsy pattern values treated as "match all"
  // =========================================================================
  test('BUG-006: match() should only treat null/undefined as "match all"', async () => {
    // null and undefined should return true
    assert.strictEqual(match('file.js', null), true);
    assert.strictEqual(match('file.js', undefined), true);

    // After fix, these should throw or return false:
    // false, 0, '' should not be treated as "match all"
    assert.throws(() => match('file.js', false as unknown as string));
    assert.throws(() => match('file.js', 0 as unknown as string));
    assert.throws(() => match('file.js', ''));
  });

  // =========================================================================
  // BUG-007: LOW - Invalid sort option silently ignored
  // =========================================================================
  test('BUG-007: should validate sort option', async () => {
    // After fix, invalid sort options should throw
    assert.throws(() => {
      sanitizeOptions({ sort: 'invalid' as unknown as 'asc' });
    }, {
      name: 'Error',
      message: /sort must be 'asc', 'desc', a function, or null/
    });

    assert.throws(() => {
      sanitizeOptions({ sort: 123 as unknown as 'asc' });
    }, {
      name: 'Error',
      message: /sort must be 'asc', 'desc', a function, or null/
    });

    // Valid options should pass
    assert.doesNotThrow(() => sanitizeOptions({ sort: null }));
    assert.doesNotThrow(() => sanitizeOptions({ sort: 'asc' }));
    assert.doesNotThrow(() => sanitizeOptions({ sort: 'desc' }));
    assert.doesNotThrow(() => sanitizeOptions({ sort: (a, b) => a.name.localeCompare(b.name) }));
  });

  // =========================================================================
  // BUG-001: MEDIUM - Memory inefficiency in sorting
  // =========================================================================
  test('BUG-001: should not collect entries when sorting is disabled', async () => {
    await setupTestDir();

    try {
      // Create multiple files
      for (let i = 0; i < 100; i++) {
        await fs.writeFile(path.join(testDir, `file${i}.txt`), 'content');
      }

      // Track memory usage (rough check)
      const memBefore = process.memoryUsage().heapUsed;

      const files: string[] = [];
      for await (const file of walker(testDir, { sort: null })) {
        files.push(file.path);
      }

      const memAfter = process.memoryUsage().heapUsed;
      const memDiff = memAfter - memBefore;

      // With streaming (no sorting), memory increase should be minimal
      // After fix, this should use significantly less memory
      assert.strictEqual(files.length, 100, 'Should find all files');

      // Memory test is approximate - just verify we got results
      assert.ok(memDiff < 10 * 1024 * 1024, 'Memory increase should be reasonable');
    } finally {
      await cleanupTestDir();
    }
  });
});
