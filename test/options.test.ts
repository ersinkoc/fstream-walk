import { test, describe } from 'node:test';
import assert from 'node:assert';
import { sanitizeOptions, DEFAULT_OPTIONS } from '../src/options.js';
import type { WalkerOptionsInput } from '../src/options.js';

describe('Options Validation', () => {
  test('should return default options when no input provided', () => {
    const result = sanitizeOptions();
    assert.deepStrictEqual(result.maxDepth, DEFAULT_OPTIONS.maxDepth);
    assert.deepStrictEqual(result.include, DEFAULT_OPTIONS.include);
    assert.deepStrictEqual(result.exclude, DEFAULT_OPTIONS.exclude);
    assert.deepStrictEqual(result.yieldDirectories, DEFAULT_OPTIONS.yieldDirectories);
    assert.deepStrictEqual(result.followSymlinks, DEFAULT_OPTIONS.followSymlinks);
    assert.deepStrictEqual(result.suppressErrors, DEFAULT_OPTIONS.suppressErrors);
    assert.deepStrictEqual(result.signal, DEFAULT_OPTIONS.signal);
    assert.deepStrictEqual(result.sort, DEFAULT_OPTIONS.sort);
    assert.deepStrictEqual(result.withStats, DEFAULT_OPTIONS.withStats);
  });

  test('should merge provided options with defaults', () => {
    const result = sanitizeOptions({ maxDepth: 5, yieldDirectories: true });
    assert.strictEqual(result.maxDepth, 5);
    assert.strictEqual(result.yieldDirectories, true);
    assert.strictEqual(result.followSymlinks, DEFAULT_OPTIONS.followSymlinks);
  });

  describe('maxDepth validation', () => {
    test('should accept 0', () => {
      assert.doesNotThrow(() => sanitizeOptions({ maxDepth: 0 }));
    });

    test('should accept positive numbers', () => {
      assert.doesNotThrow(() => sanitizeOptions({ maxDepth: 100 }));
    });

    test('should accept Infinity', () => {
      const result = sanitizeOptions({ maxDepth: Infinity });
      assert.strictEqual(result.maxDepth, Infinity);
    });

    test('should reject negative numbers', () => {
      assert.throws(() => sanitizeOptions({ maxDepth: -1 }), /maxDepth must be a non-negative number/);
    });

    test('should reject NaN', () => {
      assert.throws(() => sanitizeOptions({ maxDepth: NaN }), /maxDepth must be a non-negative number/);
    });

    test('should reject non-numeric values', () => {
      assert.throws(
        () => sanitizeOptions({ maxDepth: 'invalid' as unknown as number }),
        /maxDepth must be a non-negative number/
      );
    });
  });

  describe('sort validation', () => {
    test('should accept null', () => {
      assert.doesNotThrow(() => sanitizeOptions({ sort: null }));
    });

    test('should accept asc', () => {
      const result = sanitizeOptions({ sort: 'asc' });
      assert.strictEqual(result.sort, 'asc');
    });

    test('should accept desc', () => {
      const result = sanitizeOptions({ sort: 'desc' });
      assert.strictEqual(result.sort, 'desc');
    });

    test('should accept function', () => {
      const sortFn = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
      const result = sanitizeOptions({ sort: sortFn });
      assert.strictEqual(result.sort, sortFn);
    });

    test('should reject invalid string values', () => {
      assert.throws(
        () => sanitizeOptions({ sort: 'invalid' as unknown as 'asc' }),
        /sort must be 'asc', 'desc', a function, or null/
      );
    });

    test('should reject non-function objects', () => {
      assert.throws(
        () => sanitizeOptions({ sort: {} as unknown as 'asc' }),
        /sort must be 'asc', 'desc', a function, or null/
      );
    });
  });

  describe('signal validation', () => {
    test('should accept null', () => {
      assert.doesNotThrow(() => sanitizeOptions({ signal: null }));
    });

    test('should accept AbortSignal', () => {
      const controller = new AbortController();
      assert.doesNotThrow(() => sanitizeOptions({ signal: controller.signal }));
    });

    test('should reject non-AbortSignal objects', () => {
      assert.throws(
        () => sanitizeOptions({ signal: {} as unknown as AbortSignal }),
        /signal must be an AbortSignal or null/
      );
    });
  });

  describe('boolean options validation', () => {
    test('should accept boolean for yieldDirectories', () => {
      assert.doesNotThrow(() => sanitizeOptions({ yieldDirectories: true }));
      assert.doesNotThrow(() => sanitizeOptions({ yieldDirectories: false }));
    });

    test('should reject non-boolean for yieldDirectories', () => {
      assert.throws(
        () => sanitizeOptions({ yieldDirectories: 'true' as unknown as boolean }),
        /yieldDirectories must be a boolean/
      );
    });

    test('should accept boolean for followSymlinks', () => {
      assert.doesNotThrow(() => sanitizeOptions({ followSymlinks: true }));
      assert.doesNotThrow(() => sanitizeOptions({ followSymlinks: false }));
    });

    test('should reject non-boolean for followSymlinks', () => {
      assert.throws(
        () => sanitizeOptions({ followSymlinks: 'true' as unknown as boolean }),
        /followSymlinks must be a boolean/
      );
    });

    test('should accept boolean for suppressErrors', () => {
      assert.doesNotThrow(() => sanitizeOptions({ suppressErrors: true }));
      assert.doesNotThrow(() => sanitizeOptions({ suppressErrors: false }));
    });

    test('should reject non-boolean for suppressErrors', () => {
      assert.throws(
        () => sanitizeOptions({ suppressErrors: 'true' as unknown as boolean }),
        /suppressErrors must be a boolean/
      );
    });

    test('should accept boolean for withStats', () => {
      assert.doesNotThrow(() => sanitizeOptions({ withStats: true }));
      assert.doesNotThrow(() => sanitizeOptions({ withStats: false }));
    });

    test('should reject non-boolean for withStats', () => {
      assert.throws(
        () => sanitizeOptions({ withStats: 'true' as unknown as boolean }),
        /withStats must be a boolean/
      );
    });
  });

  describe('onProgress validation', () => {
    test('should accept null', () => {
      assert.doesNotThrow(() => sanitizeOptions({ onProgress: null }));
    });

    test('should accept function', () => {
      assert.doesNotThrow(() => sanitizeOptions({ onProgress: () => {} }));
    });

    test('should reject non-function values', () => {
      assert.throws(
        () => sanitizeOptions({ onProgress: 'callback' as unknown as () => void }),
        /onProgress must be a function or null/
      );
    });
  });
});
