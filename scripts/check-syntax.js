import { findFiles } from '../src/helpers.js';
import { execSync } from 'child_process';

const jsFiles = await findFiles('./src', { include: /\.js$/ });

let hasError = false;

for (const file of jsFiles) {
  try {
    execSync(`node --check ${file}`, { stdio: 'inherit' });
  } catch (err) {
    hasError = true;
  }
}

process.exit(hasError ? 1 : 0);
