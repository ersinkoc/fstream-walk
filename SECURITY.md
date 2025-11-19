# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of fstream-walk seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

Please report security vulnerabilities by emailing the maintainers directly or by opening a private security advisory on GitHub.

Include the following information:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- We will acknowledge your email within 48 hours
- We will provide a more detailed response within 7 days
- We will keep you informed about the progress toward a fix
- We may ask for additional information or guidance

## Security Best Practices

When using fstream-walk:

### 1. Validate Input Paths

```javascript
import path from 'node:path';
import walker from 'fstream-walk';

// Validate and normalize paths
const safePath = path.normalize(userProvidedPath);
if (!safePath.startsWith('/safe/base/path')) {
  throw new Error('Invalid path');
}

for await (const file of walker(safePath)) {
  // Process files
}
```

### 2. Be Careful with Symlinks

```javascript
// Disable symlink following if not needed
for await (const file of walker('./dir', {
  followSymlinks: false  // Default and safer
})) {
  // Process files
}
```

### 3. Handle Errors Appropriately

```javascript
// Don't suppress errors in security-sensitive contexts
for await (const file of walker('./dir', {
  suppressErrors: false  // Throw on permission errors
})) {
  // Process files
}
```

### 4. Use AbortSignal for Timeouts

```javascript
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

try {
  for await (const file of walker('./dir', {
    signal: controller.signal
  })) {
    // Process files
  }
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('Operation timed out');
  }
}
```

### 5. Validate File Patterns

```javascript
// Use specific patterns instead of broad matches
for await (const file of walker('./uploads', {
  include: /^[a-zA-Z0-9_-]+\.(jpg|png|gif)$/,
  exclude: /\.\./  // Prevent directory traversal
})) {
  // Process files
}
```

## Known Security Considerations

### Symlink Loops

When `followSymlinks: true`, circular symlinks can cause infinite loops. The library includes cycle detection, but be cautious:

```javascript
// Safe: cycle detection enabled by default
for await (const file of walker('./dir', {
  followSymlinks: true  // Use with caution
})) {
  // Cycle detection prevents infinite loops
}
```

### Path Traversal

Always validate and sanitize user-provided paths:

```javascript
import path from 'node:path';

function safeWalk(userPath, baseDir) {
  const normalized = path.normalize(path.join(baseDir, userPath));
  if (!normalized.startsWith(baseDir)) {
    throw new Error('Path traversal detected');
  }
  return walker(normalized);
}
```

### Resource Exhaustion

For very large directories, use limits:

```javascript
let count = 0;
const MAX_FILES = 10000;

for await (const file of walker('./huge-dir')) {
  if (++count > MAX_FILES) {
    throw new Error('Too many files');
  }
  // Process file
}
```

## Dependencies

This package has **zero runtime dependencies**, reducing the attack surface from third-party code.

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find similar problems
3. Prepare fixes for all supported versions
4. Release new versions as soon as possible

## Comments

If you have suggestions on how this process could be improved, please submit a pull request.
