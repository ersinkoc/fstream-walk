/**
 * Custom error classes for fstream-walk
 */

/**
 * Base error class for all fstream-walk errors
 */
export class FStreamWalkError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'FStreamWalkError';
    this.code = options.code;
    this.path = options.path;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Permission denied error
 */
export class PermissionError extends FStreamWalkError {
  constructor(message, path) {
    super(message, { code: 'EACCES', path });
    this.name = 'PermissionError';
  }
}

/**
 * Path not found error
 */
export class PathNotFoundError extends FStreamWalkError {
  constructor(message, path) {
    super(message, { code: 'ENOENT', path });
    this.name = 'PathNotFoundError';
  }
}

/**
 * Invalid path error
 */
export class InvalidPathError extends FStreamWalkError {
  constructor(message, path) {
    super(message, { code: 'EINVAL', path });
    this.name = 'InvalidPathError';
  }
}

/**
 * Symlink loop error
 */
export class SymlinkLoopError extends FStreamWalkError {
  constructor(message, path) {
    super(message, { code: 'ELOOP', path });
    this.name = 'SymlinkLoopError';
  }
}

/**
 * Operation aborted error
 */
export class AbortError extends FStreamWalkError {
  constructor(message = 'Operation was aborted') {
    super(message, { code: 'ABORT_ERR' });
    this.name = 'AbortError';
  }
}

/**
 * Max depth exceeded error
 */
export class MaxDepthError extends FStreamWalkError {
  constructor(depth, path) {
    super(`Maximum depth ${depth} exceeded at ${path}`, { code: 'EMAXDEPTH', path });
    this.name = 'MaxDepthError';
    this.depth = depth;
  }
}

/**
 * Convert system errors to fstream-walk errors
 */
export function wrapError(err, path) {
  if (err instanceof FStreamWalkError) {
    return err;
  }

  switch (err.code) {
    case 'EACCES':
    case 'EPERM':
      return new PermissionError(
        `Permission denied: ${path}`,
        path
      );

    case 'ENOENT':
      return new PathNotFoundError(
        `Path not found: ${path}`,
        path
      );

    case 'ELOOP':
      return new SymlinkLoopError(
        `Too many symbolic links: ${path}`,
        path
      );

    case 'ENOTDIR':
      return new InvalidPathError(
        `Not a directory: ${path}`,
        path
      );

    default:
      return new FStreamWalkError(
        err.message || 'Unknown error',
        { code: err.code, path }
      );
  }
}

/**
 * Check if error should be suppressed
 */
export function shouldSuppressError(err, options = {}) {
  const { suppressErrors = true } = options;

  if (!suppressErrors) {
    return false;
  }

  // Always suppress permission errors when suppressErrors is true
  if (err instanceof PermissionError) {
    return true;
  }

  // Suppress specific error codes
  if (err.code === 'EACCES' || err.code === 'EPERM') {
    return true;
  }

  return false;
}
