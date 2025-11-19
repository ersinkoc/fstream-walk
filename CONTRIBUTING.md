# Contributing to fstream-walk

First off, thank you for considering contributing to fstream-walk! 🎉

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, test cases)
- **Describe the behavior you observed** and what you expected
- **Include Node.js version** and operating system
- **Include error messages and stack traces**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **Provide code examples** if applicable

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: No dependencies needed! (zero-dependency project)
3. **Make your changes**
4. **Add tests** for any new functionality
5. **Ensure all tests pass**: `npm test`
6. **Update documentation** if needed
7. **Commit your changes** with clear commit messages
8. **Push to your fork** and submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/fstream-walk.git
cd fstream-walk

# No npm install needed! Zero dependencies 🎉

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run examples
npm run example

# Run benchmarks
npm run bench
```

## Project Structure

```
fstream-walk/
├── src/           # Source code
│   ├── index.js   # Main entry point
│   ├── core.js    # Walker implementation
│   ├── options.js # Configuration
│   ├── utils.js   # Helper functions
│   └── *.d.ts     # TypeScript definitions
├── test/          # Test files
├── examples/      # Usage examples
├── benchmarks/    # Performance tests
└── .github/       # GitHub configurations
```

## Coding Guidelines

### JavaScript Style

- Use ES Modules (`import`/`export`)
- Use async/await for asynchronous code
- Write descriptive variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Example:

```javascript
/**
 * Checks if a filename matches a pattern
 * @param {string} fileName - The name of the file
 * @param {string|RegExp|Function} pattern - The pattern to match
 * @returns {boolean}
 */
export function match(fileName, pattern) {
  if (!pattern) return true;
  if (pattern instanceof RegExp) return pattern.test(fileName);
  if (typeof pattern === 'string') return fileName.includes(pattern);
  if (typeof pattern === 'function') return pattern(fileName);
  return true;
}
```

### Testing

- Write tests for all new features
- Use Node.js native test runner
- Aim for high test coverage
- Include edge cases
- Test both success and failure scenarios

### Example Test:

```javascript
test('should filter with include (RegExp)', async () => {
  const result = [];
  for await (const entry of walker(TMP_DIR, { include: /\.js$/ })) {
    result.push(entry.path);
  }
  assert.strictEqual(result.length, 2);
  assert.ok(result.every(p => p.endsWith('.js')));
});
```

## Commit Messages

Use clear and descriptive commit messages:

```
feat: add glob pattern support
fix: handle broken symlinks gracefully
docs: update API documentation
test: add edge case tests for deep nesting
perf: optimize directory sorting
refactor: simplify filter logic
```

### Commit Message Format:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `perf`: Performance improvements
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node --test test/index.test.js

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Documentation

- Keep README.md up to date
- Add JSDoc comments for public APIs
- Update TypeScript definitions (.d.ts files)
- Add examples for new features
- Update CHANGELOG.md

## Performance Considerations

This is a performance-critical library. When contributing:

- Avoid blocking operations
- Use streaming when possible
- Minimize memory usage
- Add benchmarks for significant changes
- Profile your changes if they affect performance

## Questions?

Feel free to open an issue with your question. We're here to help!

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing! 🙏
