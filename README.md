# fstream-walk

A **zero-dependency**, **memory-efficient**, **recursive** directory walker for Node.js.
Built on top of `fs.opendir` and `Async Iterators` (Generators) to handle huge directory trees without bloating RAM.

## Features

- 🚀 **Zero Dependencies:** Lightweight and secure.
- 💾 **Memory Efficient:** Uses streams (AsyncIterators), doesn't build a huge array in memory.
- 🛑 **Abortable:** Supports `AbortSignal` to cancel long-running scans.
- 🔍 **Filtering:** Powerful `include`/`exclude` using Strings, Regex, or Functions.
- ⚙️ **Configurable:** Control depth, symlinks, and error handling.

## Installation

```bash
npm install fstream-walk
```

## Usage

```javascript
import walker from 'fstream-walk';

const options = {
  maxDepth: 5,
  include: /\.js$/,       // Only .js files
  exclude: /node_modules/ // Ignore node_modules
};

// The magic happens in the for-await loop
for await (const file of walker('./src', options)) {
  console.log(file.path);
  // file object: { path: string, dirent: fs.Dirent, depth: number }
}
```

## API

### `walker(dirPath, [options])`

Returns an `AsyncGenerator`.

#### Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `maxDepth` | `number` | `Infinity` | How deep to recurse. |
| `include` | `String\|Regex\|Fn` | `null` | Whitelist files. |
| `exclude` | `String\|Regex\|Fn` | `null` | Blacklist files. |
| `yieldDirectories` | `boolean` | `false` | Yield directory paths as well? |
| `followSymlinks` | `boolean` | `false` | Follow symbolic links? |
| `suppressErrors` | `boolean` | `true` | Ignore EACCES/EPERM errors. |
| `signal` | `AbortSignal` | `null` | Pass `AbortController.signal` to cancel. |

## License

MIT
