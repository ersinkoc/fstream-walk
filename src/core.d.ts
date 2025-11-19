import { WalkerEntry, WalkerOptions } from './index.js';

/**
 * Core recursive directory walker generator
 * @internal
 */
export function walk(
  dirPath: string,
  options: Required<WalkerOptions>,
  currentDepth?: number,
  visited?: Set<string>
): AsyncGenerator<WalkerEntry, void, unknown>;
