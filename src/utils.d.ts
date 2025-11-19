/**
 * Cross-platform path joining utility
 * @internal
 */
export const joinPath: (...paths: string[]) => string;

/**
 * Checks if a filename matches a pattern
 * @internal
 */
export function match(
  fileName: string,
  pattern: string | RegExp | ((fileName: string) => boolean) | null
): boolean;
