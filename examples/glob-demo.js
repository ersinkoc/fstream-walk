import walker from '../dist/index.js';
import { matchGlob, createGlobFilter, patterns } from '../dist/glob.js';

console.log('=== Glob Pattern Demo ===\n');

// Example 1: Basic glob patterns
console.log('1. Test glob patterns:');
const testFiles = [
  'file.js',
  'file.test.js',
  'src/utils.js',
  'src/components/Button.tsx',
  'dist/bundle.min.js',
  '.env',
  'node_modules/package/index.js'
];

console.log('\n  Pattern: *.js');
testFiles.forEach(f => {
  if (matchGlob(f, '*.js')) console.log(`    ✓ ${f}`);
});

console.log('\n  Pattern: **/*.js');
testFiles.forEach(f => {
  if (matchGlob(f, '**/*.js')) console.log(`    ✓ ${f}`);
});

console.log('\n  Pattern: **/*.{js,ts,tsx}');
testFiles.forEach(f => {
  if (matchGlob(f, '**/*.{js,ts,tsx}')) console.log(`    ✓ ${f}`);
});

// Example 2: Using glob patterns with walker
console.log('\n2. Find JavaScript files (excluding tests):');
const filter = createGlobFilter(
  patterns.javascript,
  ['**/*.test.js', '**/*.spec.js', '**/node_modules/**']
);

let count = 0;
for await (const file of walker('./src')) {
  if (filter(file.path)) {
    console.log(`  - ${file.path}`);
    count++;
  }
}
console.log(`  Total: ${count} files`);

// Example 3: Common patterns
console.log('\n3. Common glob patterns:');
console.log('  JavaScript:', patterns.javascript.join(', '));
console.log('  TypeScript:', patterns.typescript.join(', '));
console.log('  Images:', patterns.images.join(', '));
console.log('  Documents:', patterns.documents.join(', '));

// Example 4: Advanced glob matching
console.log('\n4. Advanced pattern matching:');

// Match files with numbers
const numberPattern = 'file[0-9].js';
console.log(`\n  Pattern: ${numberPattern}`);
['file1.js', 'file2.js', 'fileA.js', 'file12.js'].forEach(f => {
  const matches = matchGlob(f, numberPattern);
  console.log(`    ${matches ? '✓' : '✗'} ${f}`);
});

// Match with alternation
const altPattern = 'src/**/*.{config,settings}.{js,json}';
console.log(`\n  Pattern: ${altPattern}`);
[
  'src/app.config.js',
  'src/settings.json',
  'src/lib/db.settings.js',
  'src/utils.js'
].forEach(f => {
  const matches = matchGlob(f, altPattern);
  console.log(`    ${matches ? '✓' : '✗'} ${f}`);
});

// Example 5: Case-insensitive matching
console.log('\n5. Case-insensitive matching:');
const file = 'FILE.JS';
console.log(`  File: ${file}`);
console.log(`    Case-sensitive:   ${matchGlob(file, '*.js')}`);
console.log(`    Case-insensitive: ${matchGlob(file, '*.js', { nocase: true })}`);

// Example 6: Dotfile handling
console.log('\n6. Dotfile handling:');
const dotfile = '.gitignore';
console.log(`  File: ${dotfile}`);
console.log(`    dot=false: ${matchGlob(dotfile, '*')}`);
console.log(`    dot=true:  ${matchGlob(dotfile, '*', { dot: true })}`);

console.log('\n=== Glob Pattern Demo Complete ===');
