# API Documentation

## Core Module

### `walker(dirPath, options)`

The main entry point for directory walking.

**Parameters:**
- `dirPath` {string} - Root directory path to start walking from
- `options` {WalkerOptions} - Configuration options (optional)

**Returns:**
`AsyncGenerator<WalkerEntry>` - An async iterator yielding file/directory entries

**Example:**
```javascript
import walker from 'fstream-walk';

for await (const file of walker('./src')) {
  console.log(file.path);
}
```

---

## Types

### `WalkerOptions`

Configuration object for the walker.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxDepth` | `number` | `Infinity` | Maximum depth to recurse into subdirectories |
| `include` | `string\|RegExp\|Function` | `null` | Filter to include files |
| `exclude` | `string\|RegExp\|Function` | `null` | Filter to exclude files |
| `yieldDirectories` | `boolean` | `false` | Whether to yield directory paths |
| `followSymlinks` | `boolean` | `false` | Follow symbolic links (with cycle detection) |
| `suppressErrors` | `boolean` | `true` | Suppress permission errors (EACCES/EPERM) |
| `signal` | `AbortSignal` | `null` | AbortSignal to cancel the operation |
| `sort` | `'asc'\|'desc'\|Function` | `null` | Sort entries alphabetically or with custom function |
| `onProgress` | `Function` | `null` | Callback function called for each entry |
| `withStats` | `boolean` | `false` | Include fs.Stats in entries |

**Filter Types:**
- `string`: Checks if filename includes the string
- `RegExp`: Tests filename against the pattern
- `Function`: Custom filter function `(fileName: string) => boolean`

**Sort Types:**
- `'asc'`: Alphabetical A-Z
- `'desc'`: Alphabetical Z-A
- `Function`: Custom comparator `(a: Dirent, b: Dirent) => number`

### `WalkerEntry`

Object yielded by the walker.

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | Absolute or relative path to the file/directory |
| `dirent` | `fs.Dirent` | Directory entry object with type info |
| `depth` | `number` | Current depth level (0 = root) |
| `stats` | `fs.Stats` | File statistics (only if `withStats: true`) |

**Dirent Methods:**
- `dirent.isFile()` - Returns true if entry is a file
- `dirent.isDirectory()` - Returns true if entry is a directory
- `dirent.isSymbolicLink()` - Returns true if entry is a symbolic link
- `dirent.name` - Basename of the file/directory

---

## Helpers Module

Import: `import { ... } from 'fstream-walk/helpers'`

### `findFiles(dirPath, options)`

Find all files matching a pattern and return as an array.

**Parameters:**
- `dirPath` {string} - Directory to search
- `options` {WalkerOptions} - Walker options

**Returns:** `Promise<string[]>` - Array of file paths

**Example:**
```javascript
const files = await findFiles('./src', { include: /\.js$/ });
```

---

### `countFiles(dirPath, options)`

Count files in a directory.

**Parameters:**
- `dirPath` {string} - Directory to count
- `options` {WalkerOptions & { byExtension?: boolean }} - Options

**Returns:**
- `Promise<number>` - Total count (if `byExtension` is false)
- `Promise<Object>` - Count breakdown by extension (if `byExtension` is true)

**Example:**
```javascript
const count = await countFiles('./src');
// 42

const breakdown = await countFiles('./src', { byExtension: true });
// { '.js': 10, '.ts': 5, total: 15 }
```

---

### `calculateSize(dirPath, options)`

Calculate total size of all files in a directory.

**Parameters:**
- `dirPath` {string} - Directory to analyze
- `options` {WalkerOptions} - Walker options

**Returns:** `Promise<SizeInfo>`

**SizeInfo Object:**
```typescript
{
  totalSize: number;      // Total size in bytes
  fileCount: number;      // Number of files
  averageSize: number;    // Average file size in bytes
  totalSizeKB: string;    // Total size in KB (formatted)
  totalSizeMB: string;    // Total size in MB (formatted)
}
```

**Example:**
```javascript
const { totalSizeMB, fileCount } = await calculateSize('./src');
console.log(`${fileCount} files, ${totalSizeMB} MB`);
```

---

### `getLargestFiles(dirPath, options)`

Get largest files sorted by size.

**Parameters:**
- `dirPath` {string} - Directory to search
- `options` {WalkerOptions & { limit?: number }} - Options (default limit: 10)

**Returns:** `Promise<FileInfo[]>`

**FileInfo Object:**
```typescript
{
  path: string;
  size: number;
  sizeKB: string;
  modified: Date;
}
```

**Example:**
```javascript
const largest = await getLargestFiles('./src', { limit: 5 });
largest.forEach(f => console.log(`${f.path}: ${f.sizeKB} KB`));
```

---

### `findRecentFiles(dirPath, sinceDate, options)`

Find files modified after a specific date.

**Parameters:**
- `dirPath` {string} - Directory to search
- `sinceDate` {Date|number} - Date or timestamp
- `options` {WalkerOptions} - Walker options

**Returns:** `Promise<RecentFileInfo[]>`

**Example:**
```javascript
const yesterday = Date.now() - 24 * 60 * 60 * 1000;
const recent = await findRecentFiles('./src', yesterday);
```

---

### `buildTree(dirPath, options)`

Build a nested directory tree structure.

**Parameters:**
- `dirPath` {string} - Root directory
- `options` {WalkerOptions} - Walker options

**Returns:** `Promise<Object>` - Nested tree object

**Example:**
```javascript
const tree = await buildTree('./src');
console.log(JSON.stringify(tree, null, 2));
```

---

### `findDuplicateNames(dirPath, options)`

Find files with duplicate names (ignoring path).

**Parameters:**
- `dirPath` {string} - Directory to search
- `options` {WalkerOptions} - Walker options

**Returns:** `Promise<Object>` - Map of filename to array of paths

**Example:**
```javascript
const dupes = await findDuplicateNames('./src');
// { 'index.js': ['./src/index.js', './src/lib/index.js'] }
```

---

### `searchInFiles(dirPath, pattern, options)`

Search file contents for a pattern.

**Parameters:**
- `dirPath` {string} - Directory to search
- `pattern` {string|RegExp} - Pattern to search for
- `options` {WalkerOptions} - Walker options

**Returns:** `Promise<SearchResult[]>`

**SearchResult Object:**
```typescript
{
  path: string;
  matches: Array<{
    text: string;
    index: number;
    line: number;
  }>;
}
```

**Example:**
```javascript
const matches = await searchInFiles('./src', /TODO:/);
matches.forEach(m => {
  console.log(`${m.path}: ${m.matches.length} matches`);
});
```

---

### `findEmptyDirectories(dirPath, options)`

Find empty directories.

**Parameters:**
- `dirPath` {string} - Root directory to search
- `options` {WalkerOptions} - Walker options

**Returns:** `Promise<string[]>` - Array of empty directory paths

**Example:**
```javascript
const empty = await findEmptyDirectories('./project');
```

---

### `groupByExtension(dirPath, options)`

Group files by their extension.

**Parameters:**
- `dirPath` {string} - Directory to analyze
- `options` {WalkerOptions} - Walker options

**Returns:** `Promise<Object>` - Map of extension to array of paths

**Example:**
```javascript
const groups = await groupByExtension('./src');
// { '.js': ['file1.js', 'file2.js'], '.ts': ['file3.ts'] }
```

---

## Glob Module

Import: `import { ... } from 'fstream-walk/glob'`

### `globToRegex(pattern)`

Convert glob pattern to regular expression.

**Parameters:**
- `pattern` {string} - Glob pattern

**Returns:** `RegExp` - Regular expression

**Supported Patterns:**
- `*` - Matches any characters except path separator
- `**` - Matches any characters including path separators
- `?` - Matches single character except path separator
- `[...]` - Character class
- `{a,b}` - Alternation

**Example:**
```javascript
const regex = globToRegex('**/*.js');
regex.test('src/utils.js'); // true
```

---

### `matchGlob(filePath, patterns, options)`

Match a path against glob pattern(s).

**Parameters:**
- `filePath` {string} - File path to test
- `patterns` {string|string[]} - Glob pattern(s)
- `options` {GlobOptions} - Match options

**GlobOptions:**
- `dot` {boolean} - Include dotfiles (default: false)
- `nocase` {boolean} - Case insensitive (default: false)
- `matchBase` {boolean} - Match basename only (default: false)

**Returns:** `boolean`

**Example:**
```javascript
matchGlob('file.js', '*.js'); // true
matchGlob('src/file.js', '**/*.js'); // true
matchGlob('File.JS', '*.js', { nocase: true }); // true
```

---

### `createGlobFilter(include, exclude, options)`

Create a filter function from glob patterns.

**Parameters:**
- `include` {string|string[]|null} - Include patterns
- `exclude` {string|string[]|null} - Exclude patterns
- `options` {GlobOptions} - Match options

**Returns:** `Function` - Filter function `(filePath: string) => boolean`

**Example:**
```javascript
const filter = createGlobFilter('*.js', '*.test.js');
filter('file.js'); // true
filter('file.test.js'); // false
```

---

### `patterns`

Common glob patterns for convenience.

**Available Patterns:**
```javascript
patterns.javascript  // ['**/*.js', '**/*.mjs', '**/*.cjs']
patterns.typescript  // ['**/*.ts', '**/*.tsx']
patterns.web         // ['**/*.{js,ts,jsx,tsx,css,html}']
patterns.images      // ['**/*.{jpg,jpeg,png,gif,svg,webp}']
patterns.documents   // ['**/*.{pdf,doc,docx,txt,md}']
patterns.nodeModules // '**/node_modules/**'
patterns.dotfiles    // '**/.*'
patterns.tests       // ['**/*.test.{js,ts}', '**/*.spec.{js,ts}']
```

---

## Errors Module

Import: `import { ... } from 'fstream-walk/errors'`

### Error Classes

All error classes extend `FStreamWalkError` which extends `Error`.

#### `FStreamWalkError`

Base error class for all fstream-walk errors.

**Properties:**
- `message` {string} - Error message
- `code` {string} - Error code
- `path` {string} - Path where error occurred

---

#### `PermissionError`

Permission denied error (EACCES, EPERM).

**Example:**
```javascript
catch (err) {
  if (err instanceof PermissionError) {
    console.log(`Access denied: ${err.path}`);
  }
}
```

---

#### `PathNotFoundError`

Path not found error (ENOENT).

---

#### `InvalidPathError`

Invalid path error (EINVAL, ENOTDIR).

---

#### `SymlinkLoopError`

Symlink loop error (ELOOP).

---

#### `AbortError`

Operation aborted error.

---

#### `MaxDepthError`

Maximum depth exceeded error.

**Properties:**
- `depth` {number} - The depth that was exceeded

---

### `wrapError(err, path)`

Convert system errors to fstream-walk errors.

**Parameters:**
- `err` {Error} - Original error
- `path` {string} - Path where error occurred

**Returns:** `FStreamWalkError` - Wrapped error

**Example:**
```javascript
try {
  await fs.readFile(path);
} catch (err) {
  throw wrapError(err, path);
}
```

---

### `shouldSuppressError(err, options)`

Check if error should be suppressed.

**Parameters:**
- `err` {Error} - Error to check
- `options` {Object} - Options with `suppressErrors` property

**Returns:** `boolean`

---

## Performance Tips

1. **Use filters early:** Apply `include`/`exclude` to reduce processing
2. **Limit depth:** Use `maxDepth` to avoid deep recursion
3. **Avoid sorting large directories:** Sorting requires loading all entries into memory
4. **Use AbortSignal:** Cancel operations early when condition met
5. **Stream processing:** Process files as they're yielded instead of collecting
6. **Batch operations:** Use helper functions for batch operations

**Good:**
```javascript
for await (const file of walker('./huge-dir', {
  include: /\.js$/,
  maxDepth: 3
})) {
  await processFile(file.path);
}
```

**Avoid:**
```javascript
const files = [];
for await (const file of walker('./huge-dir')) {
  files.push(file);
}
// Large memory usage!
```

---

## Error Handling

### Default Behavior

By default, permission errors are suppressed and the walker continues:

```javascript
for await (const file of walker('./dir')) {
  // Permission errors are silently skipped
}
```

### Explicit Error Handling

```javascript
try {
  for await (const file of walker('./dir', { suppressErrors: false })) {
    console.log(file.path);
  }
} catch (err) {
  if (err instanceof PermissionError) {
    console.error('Permission denied:', err.path);
  } else if (err instanceof PathNotFoundError) {
    console.error('Path not found:', err.path);
  } else {
    throw err;
  }
}
```

---

## License

MIT
