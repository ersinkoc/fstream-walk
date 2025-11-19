import { test, describe } from 'node:test';
import assert from 'node:assert';
import { globToRegex, matchGlob, createGlobFilter, patterns } from '../src/glob.js';

describe('Glob Pattern Matching', () => {
  test('globToRegex should convert * pattern', () => {
    const regex = globToRegex('*.js');
    assert.ok(regex.test('file.js'));
    assert.ok(!regex.test('file.txt'));
    assert.ok(!regex.test('dir/file.js'));
  });

  test('globToRegex should convert ** pattern', () => {
    const regex = globToRegex('**/*.js');
    assert.ok(regex.test('file.js'));
    assert.ok(regex.test('dir/file.js'));
    assert.ok(regex.test('dir/sub/file.js'));
    assert.ok(!regex.test('file.txt'));
  });

  test('globToRegex should handle ? pattern', () => {
    const regex = globToRegex('file?.js');
    assert.ok(regex.test('file1.js'));
    assert.ok(regex.test('fileA.js'));
    assert.ok(!regex.test('file12.js'));
  });

  test('globToRegex should handle [...] character class', () => {
    const regex = globToRegex('file[0-9].js');
    assert.ok(regex.test('file0.js'));
    assert.ok(regex.test('file9.js'));
    assert.ok(!regex.test('fileA.js'));
  });

  test('globToRegex should handle {...} alternation', () => {
    const regex = globToRegex('file.{js,ts}');
    assert.ok(regex.test('file.js'));
    assert.ok(regex.test('file.ts'));
    assert.ok(!regex.test('file.txt'));
  });

  test('matchGlob should match single pattern', () => {
    assert.ok(matchGlob('file.js', '*.js'));
    assert.ok(!matchGlob('file.txt', '*.js'));
  });

  test('matchGlob should match array of patterns', () => {
    assert.ok(matchGlob('file.js', ['*.js', '*.ts']));
    assert.ok(matchGlob('file.ts', ['*.js', '*.ts']));
    assert.ok(!matchGlob('file.txt', ['*.js', '*.ts']));
  });

  test('matchGlob with dot option should handle dotfiles', () => {
    assert.ok(!matchGlob('dir/.hidden', '*'));
    assert.ok(matchGlob('dir/.hidden', '*', { dot: true }));
  });

  test('matchGlob with nocase option should be case insensitive', () => {
    assert.ok(!matchGlob('File.JS', '*.js'));
    assert.ok(matchGlob('File.JS', '*.js', { nocase: true }));
  });

  test('matchGlob with matchBase should match basename only', () => {
    assert.ok(!matchGlob('dir/file.js', 'file.js'));
    assert.ok(matchGlob('dir/file.js', 'file.js', { matchBase: true }));
  });

  test('createGlobFilter should create filter function', () => {
    const filter = createGlobFilter('*.js', '*.test.js');
    assert.ok(filter('file.js'));
    assert.ok(!filter('file.test.js'));
    assert.ok(!filter('file.txt'));
  });

  test('patterns should provide common globs', () => {
    assert.ok(Array.isArray(patterns.javascript));
    assert.ok(Array.isArray(patterns.typescript));
    assert.ok(typeof patterns.nodeModules === 'string');
  });
});
