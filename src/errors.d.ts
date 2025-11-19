/**
 * Base error class for all fstream-walk errors
 */
export class FStreamWalkError extends Error {
  code?: string;
  path?: string;
  constructor(message: string, options?: { code?: string; path?: string });
}

/**
 * Permission denied error (EACCES, EPERM)
 */
export class PermissionError extends FStreamWalkError {
  constructor(message: string, path: string);
}

/**
 * Path not found error (ENOENT)
 */
export class PathNotFoundError extends FStreamWalkError {
  constructor(message: string, path: string);
}

/**
 * Invalid path error (EINVAL, ENOTDIR)
 */
export class InvalidPathError extends FStreamWalkError {
  constructor(message: string, path: string);
}

/**
 * Symlink loop error (ELOOP)
 */
export class SymlinkLoopError extends FStreamWalkError {
  constructor(message: string, path: string);
}

/**
 * Operation aborted error
 */
export class AbortError extends FStreamWalkError {
  constructor(message?: string);
}

/**
 * Max depth exceeded error
 */
export class MaxDepthError extends FStreamWalkError {
  depth: number;
  constructor(depth: number, path: string);
}

/**
 * Convert system errors to fstream-walk errors
 */
export function wrapError(err: Error, path: string): FStreamWalkError;

/**
 * Check if error should be suppressed
 */
export function shouldSuppressError(
  err: Error,
  options?: { suppressErrors?: boolean }
): boolean;
