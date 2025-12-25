import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  FStreamWalkError,
  PermissionError,
  PathNotFoundError,
  InvalidPathError,
  SymlinkLoopError,
  AbortError,
  MaxDepthError,
  wrapError,
  shouldSuppressError
} from '../src/errors.js';

describe('Error Classes', () => {
  test('FStreamWalkError should create base error', () => {
    const err = new FStreamWalkError('test message', { code: 'TEST', path: '/test/path' });
    assert.strictEqual(err.name, 'FStreamWalkError');
    assert.strictEqual(err.message, 'test message');
    assert.strictEqual(err.code, 'TEST');
    assert.strictEqual(err.path, '/test/path');
    assert.ok(err instanceof Error);
  });

  test('FStreamWalkError should work with empty options', () => {
    const err = new FStreamWalkError('test message');
    assert.strictEqual(err.name, 'FStreamWalkError');
    assert.strictEqual(err.message, 'test message');
    assert.strictEqual(err.code, undefined);
    assert.strictEqual(err.path, undefined);
  });

  test('PermissionError should have correct properties', () => {
    const err = new PermissionError('Access denied', '/restricted/path');
    assert.strictEqual(err.name, 'PermissionError');
    assert.strictEqual(err.message, 'Access denied');
    assert.strictEqual(err.code, 'EACCES');
    assert.strictEqual(err.path, '/restricted/path');
    assert.ok(err instanceof FStreamWalkError);
  });

  test('PathNotFoundError should have correct properties', () => {
    const err = new PathNotFoundError('Path not found', '/missing/path');
    assert.strictEqual(err.name, 'PathNotFoundError');
    assert.strictEqual(err.code, 'ENOENT');
    assert.strictEqual(err.path, '/missing/path');
    assert.ok(err instanceof FStreamWalkError);
  });

  test('InvalidPathError should have correct properties', () => {
    const err = new InvalidPathError('Invalid path', '/invalid');
    assert.strictEqual(err.name, 'InvalidPathError');
    assert.strictEqual(err.code, 'EINVAL');
    assert.strictEqual(err.path, '/invalid');
    assert.ok(err instanceof FStreamWalkError);
  });

  test('SymlinkLoopError should have correct properties', () => {
    const err = new SymlinkLoopError('Symlink loop detected', '/loop/path');
    assert.strictEqual(err.name, 'SymlinkLoopError');
    assert.strictEqual(err.code, 'ELOOP');
    assert.strictEqual(err.path, '/loop/path');
    assert.ok(err instanceof FStreamWalkError);
  });

  test('AbortError should have correct properties', () => {
    const err = new AbortError();
    assert.strictEqual(err.name, 'AbortError');
    assert.strictEqual(err.message, 'Operation was aborted');
    assert.strictEqual(err.code, 'ABORT_ERR');
    assert.ok(err instanceof FStreamWalkError);
  });

  test('AbortError should accept custom message', () => {
    const err = new AbortError('Custom abort message');
    assert.strictEqual(err.message, 'Custom abort message');
  });

  test('MaxDepthError should have correct properties', () => {
    const err = new MaxDepthError(10, '/deep/path');
    assert.strictEqual(err.name, 'MaxDepthError');
    assert.strictEqual(err.depth, 10);
    assert.strictEqual(err.code, 'EMAXDEPTH');
    assert.strictEqual(err.path, '/deep/path');
    assert.ok(err.message.includes('10'));
    assert.ok(err instanceof FStreamWalkError);
  });
});

describe('wrapError', () => {
  test('should wrap EACCES error as PermissionError', () => {
    const originalError = Object.assign(new Error('Original'), { code: 'EACCES' });
    const wrapped = wrapError(originalError, '/test/path');
    assert.ok(wrapped instanceof PermissionError);
    assert.strictEqual(wrapped.path, '/test/path');
  });

  test('should wrap EPERM error as PermissionError', () => {
    const originalError = Object.assign(new Error('Original'), { code: 'EPERM' });
    const wrapped = wrapError(originalError, '/test/path');
    assert.ok(wrapped instanceof PermissionError);
  });

  test('should wrap ENOENT error as PathNotFoundError', () => {
    const originalError = Object.assign(new Error('Original'), { code: 'ENOENT' });
    const wrapped = wrapError(originalError, '/missing/path');
    assert.ok(wrapped instanceof PathNotFoundError);
    assert.strictEqual(wrapped.path, '/missing/path');
  });

  test('should wrap ELOOP error as SymlinkLoopError', () => {
    const originalError = Object.assign(new Error('Original'), { code: 'ELOOP' });
    const wrapped = wrapError(originalError, '/loop/path');
    assert.ok(wrapped instanceof SymlinkLoopError);
  });

  test('should wrap ENOTDIR error as InvalidPathError', () => {
    const originalError = Object.assign(new Error('Original'), { code: 'ENOTDIR' });
    const wrapped = wrapError(originalError, '/not/dir');
    assert.ok(wrapped instanceof InvalidPathError);
  });

  test('should wrap unknown error as FStreamWalkError', () => {
    const originalError = Object.assign(new Error('Unknown error'), { code: 'EUNKNOWN' });
    const wrapped = wrapError(originalError, '/test/path');
    assert.ok(wrapped instanceof FStreamWalkError);
    assert.strictEqual(wrapped.code, 'EUNKNOWN');
  });

  test('should return FStreamWalkError unchanged', () => {
    const originalError = new FStreamWalkError('Already wrapped', { code: 'TEST' });
    const wrapped = wrapError(originalError, '/test/path');
    assert.strictEqual(wrapped, originalError);
  });

  test('should handle error without message', () => {
    const originalError = Object.assign(new Error(), { code: 'ETEST' });
    originalError.message = '';
    const wrapped = wrapError(originalError, '/test/path');
    assert.strictEqual(wrapped.message, 'Unknown error');
  });
});

describe('shouldSuppressError', () => {
  test('should suppress PermissionError when suppressErrors is true', () => {
    const err = new PermissionError('test', '/path');
    assert.strictEqual(shouldSuppressError(err, { suppressErrors: true }), true);
  });

  test('should not suppress PermissionError when suppressErrors is false', () => {
    const err = new PermissionError('test', '/path');
    assert.strictEqual(shouldSuppressError(err, { suppressErrors: false }), false);
  });

  test('should suppress EACCES system error when suppressErrors is true', () => {
    const err = Object.assign(new Error('test'), { code: 'EACCES' });
    assert.strictEqual(shouldSuppressError(err, { suppressErrors: true }), true);
  });

  test('should suppress EPERM system error when suppressErrors is true', () => {
    const err = Object.assign(new Error('test'), { code: 'EPERM' });
    assert.strictEqual(shouldSuppressError(err, { suppressErrors: true }), true);
  });

  test('should not suppress other errors', () => {
    const err = Object.assign(new Error('test'), { code: 'ENOENT' });
    assert.strictEqual(shouldSuppressError(err, { suppressErrors: true }), false);
  });

  test('should default suppressErrors to true', () => {
    const err = new PermissionError('test', '/path');
    assert.strictEqual(shouldSuppressError(err), true);
  });
});
