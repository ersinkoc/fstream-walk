# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-12-25

### Fixed
- **CRITICAL**: Fixed TypeError in `searchInFiles()` when using non-global RegExp patterns - now automatically adds global flag
- **HIGH**: Fixed potential infinite loop with circular symlinks when `followSymlinks: true` and `suppressErrors: true` - now tracks original path as fallback
- **MEDIUM**: Fixed memory inefficiency where entries were always collected into array even when sorting was disabled - now streams directly when `sort` is null
- **MEDIUM**: Added comprehensive input validation to `sanitizeOptions()` - now validates `maxDepth`, `sort`, `signal`, and all boolean options
- **LOW**: Added pattern type validation in `match()` function - now throws TypeError for invalid pattern types instead of silently returning true
- **LOW**: Fixed falsy pattern handling in `match()` - now only treats null/undefined as "match all", not false/0/""
- **LOW**: Added validation for invalid `sort` options - now throws error instead of silently ignoring
- **LOW**: Optimized line number calculation in `searchInFiles()` from O(n×m) to O(n+m) complexity

### Added
- 12 new regression tests covering all bug fixes (100% pass rate)
- Comprehensive bug analysis documentation (`BUG_ANALYSIS.md`)
- Detailed bug fix report (`BUG_FIX_REPORT.md`)

### Changed
- **BREAKING**: Invalid options now throw validation errors instead of being silently accepted
  - `maxDepth` must be a non-negative number or Infinity (no NaN, negative values, or strings)
  - `sort` must be 'asc', 'desc', a function, or null (no invalid strings or numbers)
  - `include`/`exclude` patterns must be string, RegExp, function, null, or undefined (no numbers, objects, or arrays)
  - All boolean options must be actual booleans
  - Empty string patterns now throw TypeError (use null for "match all")

### Performance
- Improved memory efficiency for large directories when sorting is disabled
- Optimized `searchInFiles()` line number calculation for files with many matches

### Security
- Fixed potential infinite loop vulnerability with circular symlinks

## [1.0.1] - 2025-11-19

### Fixed
- Documentation improvements and corrections
- Package metadata optimization for npm publishing

### Changed
- Enhanced README with better examples and clarity
- Improved TypeScript definitions documentation

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

[1.0.1]: https://github.com/ersinkoc/fstream-walk/releases/tag/v1.0.1
[1.0.0]: https://github.com/ersinkoc/fstream-walk/releases/tag/v1.0.0
