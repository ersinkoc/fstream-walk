# Bug Fix Report: fstream-walk@1.0.1
Date: 2025-12-25

## Summary Table

| ID | Severity | Category | File:Line | Status | Test |
|----|----------|----------|-----------|--------|------|
| BUG-001 | MEDIUM | Performance | core.js:43-52 | 🔄 Pending | ⏳ |
| BUG-002 | HIGH | Logic | core.js:26-28 | 🔄 Pending | ⏳ |
| BUG-003 | CRITICAL | Runtime | helpers.js:238 | 🔄 Pending | ⏳ |
| BUG-004 | MEDIUM | Validation | options.js:19 | 🔄 Pending | ⏳ |
| BUG-005 | LOW | Validation | utils.js:15-21 | 🔄 Pending | ⏳ |
| BUG-006 | LOW | Logic | utils.js:16 | 🔄 Pending | ⏳ |
| BUG-007 | LOW | Validation | core.js:150-156 | 🔄 Pending | ⏳ |
| BUG-008 | LOW | Performance | helpers.js:251 | 🔄 Pending | ⏳ |

---

## Detailed Bug Documentation

### BUG-001: Memory Inefficiency - Unnecessary Array Collection
**Severity**: MEDIUM
**Category**: Performance
**Location**: `src/core.js:43-52`

**Problem**: The code always collects all directory entries into an array, even when sorting is not requested. This wastes memory for large directories when `options.sort` is `null`.

**Expected**: Only collect entries into array when sorting is actually needed. Stream entries directly when no sorting is required.

**Root Cause**: The sorting logic doesn't check if sorting is needed before collecting entries.

**Proof**:
```javascript
// Current code (lines 43-52)
const entries = [];
for await (const dirent of dirHandle) {
  if (options.signal?.aborted) break;
  entries.push(dirent);
}

// Apply sorting if requested
if (options.sort) {
  sortEntries(entries, options.sort);
}
```

Even when `options.sort` is `null`, we still push all entries into the array unnecessarily.

**Impact**: Memory inefficiency for large directories. A directory with 100,000 files would unnecessarily buffer all entries in memory.

---

### BUG-002: Potential Infinite Loop with Circular Symlinks
**Severity**: HIGH
**Category**: Logic | Async
**Location**: `src/core.js:26-28`

**Problem**: When `followSymlinks` is true and `realpath()` fails, but `suppressErrors` is also true, the directory is not added to the `visited` set. This can cause infinite loops with circular symlinks.

**Expected**: Either skip the directory when realpath fails, or add the original path to `visited` as a fallback.

**Root Cause**: Error suppression without fallback protection for circular symlinks.

**Proof**:
```javascript
// Lines 20-29
if (options.followSymlinks) {
  try {
    const realPath = await fs.realpath(dirPath);
    if (visited.has(realPath)) return;
    visited.add(realPath);
  } catch (err) {
    // If we can't resolve path, proceed cautiously or skip based on policy
    if (!options.suppressErrors) throw err;
    // BUG: If suppressErrors is true, we continue WITHOUT adding to visited!
    // This can cause infinite loops with circular symlinks
  }
}
```

**Impact**: Infinite loop or stack overflow when encountering circular symlinks with `followSymlinks: true, suppressErrors: true`.

---

### BUG-003: TypeError with Non-Global RegExp in searchInFiles
**Severity**: CRITICAL
**Category**: Runtime | Type
**Location**: `src/helpers.js:238-243`

**Problem**: When a user passes a RegExp pattern without the global (`g`) flag to `searchInFiles()`, the code throws a TypeError because `matchAll()` requires a global regex.

**Expected**: Ensure the regex always has the global flag before using `matchAll()`.

**Root Cause**: Missing validation/conversion of RegExp flags.

**Proof**:
```javascript
// Line 238
const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : pattern;

// Line 243
const matches = [...content.matchAll(regex)];
// ❌ TypeError: String.prototype.matchAll called with a non-global RegExp argument
```

**Test Case**:
```javascript
const pattern = /TODO/; // No 'g' flag
await searchInFiles('./src', pattern);
// Throws: TypeError: matchAll requires global RegExp
```

**Impact**: Crashes when users pass non-global RegExp patterns, breaking the API contract.

---

### BUG-004: No Validation for maxDepth Option
**Severity**: MEDIUM
**Category**: Validation | Edge Case
**Location**: `src/options.js:19-21`

**Problem**: The `maxDepth` option accepts any value without validation. Negative numbers, `NaN`, strings, or other invalid values are not rejected.

**Expected**: Validate that `maxDepth` is either `Infinity` or a non-negative integer.

**Root Cause**: Missing input validation in `sanitizeOptions()`.

**Proof**:
```javascript
// These should all be rejected but currently pass through:
walker('.', { maxDepth: -5 });      // Negative - processes nothing
walker('.', { maxDepth: NaN });     // NaN - infinite recursion
walker('.', { maxDepth: "hello" }); // String - unpredictable behavior
walker('.', { maxDepth: 1.5 });     // Non-integer - works but semantically wrong
```

**Impact**: Silent failures or unexpected behavior. `maxDepth: -1` results in no files being returned. `maxDepth: NaN` causes infinite recursion.

---

### BUG-005: No Validation for Pattern Types in match()
**Severity**: LOW
**Category**: Validation | Type
**Location**: `src/utils.js:15-21`

**Problem**: The `match()` function accepts any type for `pattern` and returns `true` for unhandled types (like numbers, objects, arrays).

**Expected**: Either validate pattern types or throw an error for invalid types.

**Root Cause**: Overly permissive default case.

**Proof**:
```javascript
// utils.js lines 15-21
export function match(fileName, pattern) {
  if (!pattern) return true;
  if (pattern instanceof RegExp) return pattern.test(fileName);
  if (typeof pattern === 'string') return fileName.includes(pattern);
  if (typeof pattern === 'function') return pattern(fileName);
  return true; // ❌ Matches EVERYTHING for invalid types
}

// These should error but return true:
match('test.js', 123);           // number - returns true
match('test.js', {});            // object - returns true
match('test.js', ['*.js']);      // array - returns true
```

**Impact**: Silent acceptance of invalid filter values, leading to unexpected "match all" behavior.

---

### BUG-006: Falsy Pattern Values Treated as "Match All"
**Severity**: LOW
**Category**: Logic | Edge Case
**Location**: `src/utils.js:16`

**Problem**: The check `if (!pattern) return true` treats all falsy values (`null`, `undefined`, `false`, `0`, `""`) as "match all", but only `null` and `undefined` should have this behavior.

**Expected**: Only treat `null` and `undefined` as "no filter". Values like `false`, `0`, `""` should either error or be handled explicitly.

**Root Cause**: Using falsy check instead of explicit null/undefined check.

**Proof**:
```javascript
// Current code
if (!pattern) return true;

// These all return true (match all):
match('file.js', null);      // ✓ Correct - no filter
match('file.js', undefined); // ✓ Correct - no filter
match('file.js', false);     // ❌ Unexpected - should this match all?
match('file.js', 0);         // ❌ Unexpected
match('file.js', '');        // ❌ Unexpected - empty string
```

**Impact**: Edge case bug. Users passing `include: false` or `include: 0` would get unexpected "match all" behavior.

---

### BUG-007: Invalid Sort Option Silently Ignored
**Severity**: LOW
**Category**: Validation
**Location**: `src/core.js:150-156`

**Problem**: Invalid `sort` option values (not `'asc'`, `'desc'`, or a function) are silently ignored without warning or error.

**Expected**: Throw an error or warn when an invalid sort value is provided.

**Root Cause**: Missing validation and no else clause in sortEntries.

**Proof**:
```javascript
// sortEntries function (lines 149-157)
function sortEntries(entries, sortType) {
  if (typeof sortType === 'function') {
    entries.sort(sortType);
  } else if (sortType === 'asc') {
    entries.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortType === 'desc') {
    entries.sort((a, b) => b.name.localeCompare(a.name));
  }
  // ❌ No else clause - invalid values silently ignored
}

// These should error but are silently ignored:
walker('.', { sort: 'invalid' });
walker('.', { sort: 123 });
walker('.', { sort: {} });
```

**Impact**: Silent failures - users may think sorting is applied when it's not.

---

### BUG-008: Inefficient Line Number Calculation in searchInFiles
**Severity**: LOW
**Category**: Performance
**Location**: `src/helpers.js:251`

**Problem**: For each match in a file, the code recalculates line numbers from the beginning by splitting the entire content substring. This is O(n*m) complexity where n is file size and m is number of matches.

**Expected**: Calculate line numbers incrementally or use a more efficient method.

**Root Cause**: Naive implementation that recalculates for each match.

**Proof**:
```javascript
// Line 251
line: content.substring(0, m.index).split('\n').length

// For a file with 1000 matches:
// - Match 1: split characters 0-100
// - Match 2: split characters 0-200
// - Match 3: split characters 0-300
// - ...
// - Match 1000: split characters 0-99999
// This repeatedly processes the same content
```

**Impact**: Performance degradation when searching large files with many matches. Not a critical bug but worth optimizing.

---

## Verification Commands

```bash
# Run these to verify current bugs exist
npm test

# Type checking (will show typing issues but not runtime bugs)
npx tsc --noEmit --strict --checkJs src/*.js

# Check for TODO/FIXME
grep -rn "TODO\|FIXME\|HACK" src/

# Test specific bug scenarios (to be created)
node test/bug-001.test.js  # Memory test
node test/bug-002.test.js  # Symlink loop test
node test/bug-003.test.js  # RegExp test
# ... etc
```

---

## Fix Priority

1. **CRITICAL** (Fix immediately):
   - BUG-003: RegExp TypeError in searchInFiles

2. **HIGH** (Fix soon):
   - BUG-002: Circular symlink infinite loop

3. **MEDIUM** (Important improvements):
   - BUG-001: Memory inefficiency
   - BUG-004: Options validation

4. **LOW** (Nice to have):
   - BUG-005, BUG-006, BUG-007, BUG-008: Various validation and performance improvements

---

## Next Steps

1. Create test cases for each bug
2. Fix bugs in priority order
3. Verify all tests pass
4. Update documentation
5. Create comprehensive test coverage
