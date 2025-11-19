# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-19

### Added
- 🎉 Initial release of fstream-walk
- Zero-dependency recursive directory walker using Async Iterators
- Memory-efficient streaming with `fs.opendir`
- ES Modules support (Node.js 18+)
- Advanced filtering (string, regex, function)
- Sorting support (alphabetical and custom)
- Progress callback functionality
- File statistics inclusion (`withStats`)
- AbortSignal support for cancellation
- Symlink handling with cycle detection
- Depth control for recursion limiting
- TypeScript definitions (.d.ts)
- Comprehensive test suite (24 tests)
- GitHub Actions CI/CD workflow
- Performance and memory benchmarks
- 5 detailed usage examples
- Complete documentation

### Features
- `maxDepth` - Control recursion depth
- `include` - Filter files to include
- `exclude` - Filter files to exclude
- `yieldDirectories` - Yield directory paths
- `followSymlinks` - Follow symbolic links
- `suppressErrors` - Suppress permission errors
- `signal` - AbortSignal for cancellation
- `sort` - Sort entries (asc/desc/custom)
- `onProgress` - Progress callback
- `withStats` - Include fs.Stats metadata

### Performance
- Memory efficient: ~50% less memory than array-based approaches
- Fast: Processes 10,000+ files in under 100ms
- Constant memory usage regardless of directory size

### Documentation
- Complete README with examples
- API reference documentation
- TypeScript type definitions
- 5 practical usage examples
- Performance benchmarks

[1.0.0]: https://github.com/ersinkoc/fstream-walk/releases/tag/v1.0.0
