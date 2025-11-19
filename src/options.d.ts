import { WalkerOptions } from './index.js';

/**
 * Default configuration options
 */
export const DEFAULT_OPTIONS: Required<WalkerOptions>;

/**
 * Merges user options with defaults
 * @internal
 */
export function sanitizeOptions(opts?: WalkerOptions): Required<WalkerOptions>;
