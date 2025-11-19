/**
 * Simple glob pattern matcher (zero-dependency implementation)
 * Supports: *, **, ?, [...], {...}
 */

/**
 * Convert glob pattern to regex
 * @param {string} pattern - Glob pattern
 * @returns {RegExp} Regular expression
 */
export function globToRegex(pattern) {
  let regexStr = '^';
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    switch (char) {
      case '*':
        if (pattern[i + 1] === '*') {
          // ** matches any number of path segments
          if (pattern[i + 2] === '/') {
            regexStr += '(?:.*\\/)?';
            i += 3;
          } else {
            regexStr += '.*';
            i += 2;
          }
        } else {
          // * matches anything except path separator
          regexStr += '[^/]*';
          i++;
        }
        break;

      case '?':
        // ? matches single character except path separator
        regexStr += '[^/]';
        i++;
        break;

      case '[':
        // [...] character class
        const closeIdx = pattern.indexOf(']', i);
        if (closeIdx === -1) {
          regexStr += '\\[';
          i++;
        } else {
          let charClass = pattern.substring(i + 1, closeIdx);
          // Handle negation
          if (charClass[0] === '!') {
            charClass = '^' + charClass.slice(1);
          }
          regexStr += '[' + charClass + ']';
          i = closeIdx + 1;
        }
        break;

      case '{':
        // {...} alternation
        const closeBrace = pattern.indexOf('}', i);
        if (closeBrace === -1) {
          regexStr += '\\{';
          i++;
        } else {
          const options = pattern.substring(i + 1, closeBrace).split(',');
          regexStr += '(?:' + options.map(opt =>
            opt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          ).join('|') + ')';
          i = closeBrace + 1;
        }
        break;

      case '/':
      case '.':
      case '+':
      case '^':
      case '$':
      case '(':
      case ')':
      case '|':
      case '\\':
        // Escape special regex characters
        regexStr += '\\' + char;
        i++;
        break;

      default:
        regexStr += char;
        i++;
    }
  }

  regexStr += '$';
  return new RegExp(regexStr);
}

/**
 * Match a path against a glob pattern
 * @param {string} filePath - File path to test
 * @param {string|string[]} patterns - Glob pattern(s)
 * @param {Object} options - Match options
 * @returns {boolean}
 */
export function matchGlob(filePath, patterns, options = {}) {
  const {
    dot = false,           // Include dotfiles
    nocase = false,        // Case insensitive
    matchBase = false      // Match basename only
  } = options;

  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Convert to array if single pattern
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];

  // Check if this is a dotfile (starts with dot in basename)
  const basename = normalizedPath.split('/').pop();
  const isDotfile = basename && basename.startsWith('.');

  // Skip dotfiles if dot=false
  if (!dot && isDotfile) {
    return false;
  }

  for (const pattern of patternArray) {
    const normalizedPattern = pattern.replace(/\\/g, '/');

    // Create regex from pattern
    const regex = globToRegex(normalizedPattern);

    // Apply case insensitivity
    const flags = nocase ? 'i' : '';
    const testRegex = new RegExp(regex.source, flags);

    // Determine what to test against:
    // - If matchBase is true, always use basename
    // - If pattern has wildcard/special chars but no '/', test against basename
    // - Otherwise test full path
    let testPath = normalizedPath;
    const hasWildcard = /[*?[\]{]/.test(normalizedPattern);

    if (matchBase) {
      testPath = basename;
    } else if (!normalizedPattern.includes('/') && normalizedPath.includes('/') && hasWildcard) {
      testPath = basename;
    }

    if (testRegex.test(testPath)) {
      return true;
    }
  }

  return false;
}

/**
 * Create a filter function from glob patterns
 * @param {string|string[]} include - Include patterns
 * @param {string|string[]} exclude - Exclude patterns
 * @param {Object} options - Match options
 * @returns {Function} Filter function
 */
export function createGlobFilter(include, exclude, options = {}) {
  return (filePath) => {
    // Check exclude first
    if (exclude && matchGlob(filePath, exclude, options)) {
      return false;
    }

    // Then check include
    if (include) {
      return matchGlob(filePath, include, options);
    }

    return true;
  };
}

/**
 * Common glob patterns for convenience
 */
export const patterns = {
  javascript: ['**/*.js', '**/*.mjs', '**/*.cjs'],
  typescript: ['**/*.ts', '**/*.tsx'],
  web: ['**/*.{js,ts,jsx,tsx,css,html}'],
  images: ['**/*.{jpg,jpeg,png,gif,svg,webp}'],
  documents: ['**/*.{pdf,doc,docx,txt,md}'],
  nodeModules: '**/node_modules/**',
  dotfiles: '**/.*',
  tests: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}', '**/__tests__/**']
};
