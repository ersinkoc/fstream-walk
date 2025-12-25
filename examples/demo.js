import walker from '../dist/index.js';

console.log('=== Demo: fstream-walk ===\n');

// Example 1: List all files recursively
console.log('1. List all JavaScript files in src/');
for await (const file of walker('./src', { include: /\.js$/ })) {
  console.log(`  - ${file.path}`);
}

// Example 2: Limit depth
console.log('\n2. List files with maxDepth=0 (only root level)');
for await (const file of walker('./src', { maxDepth: 0 })) {
  console.log(`  - ${file.path}`);
}

// Example 3: Yield directories too
console.log('\n3. Include directories in the output');
for await (const entry of walker('.', {
  maxDepth: 1,
  yieldDirectories: true,
  exclude: 'node_modules'
})) {
  const type = entry.dirent.isDirectory() ? '[DIR]' : '[FILE]';
  console.log(`  ${type} ${entry.path}`);
}

console.log('\n=== Demo Complete ===');
