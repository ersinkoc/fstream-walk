import walker from '../src/index.js';

console.log('=== Advanced Features Examples ===\n');

// Example 1: Sort files alphabetically (ascending)
console.log('1. Sort files alphabetically (A-Z):');
for await (const file of walker('./src', { sort: 'asc', maxDepth: 0 })) {
  console.log(`  - ${file.dirent.name}`);
}

// Example 2: Sort files in reverse order
console.log('\n2. Sort files in reverse order (Z-A):');
for await (const file of walker('./src', { sort: 'desc', maxDepth: 0 })) {
  console.log(`  - ${file.dirent.name}`);
}

// Example 3: Custom sorting (directories first, then files)
console.log('\n3. Custom sort - directories first, then files:');
for await (const entry of walker('.', {
  maxDepth: 0,
  yieldDirectories: true,
  sort: (a, b) => {
    // Directories first
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    // Then alphabetically
    return a.name.localeCompare(b.name);
  }
})) {
  const type = entry.dirent.isDirectory() ? '[DIR] ' : '[FILE]';
  console.log(`  ${type} ${entry.dirent.name}`);
}

// Example 4: Progress callback
console.log('\n4. Scan with progress callback:');
let fileCount = 0;
let dirCount = 0;

for await (const entry of walker('.', {
  maxDepth: 2,
  yieldDirectories: true,
  exclude: 'node_modules',
  onProgress: (entry) => {
    if (entry.dirent.isDirectory()) {
      dirCount++;
    } else {
      fileCount++;
    }
    // Update progress every 10 items
    if ((fileCount + dirCount) % 10 === 0) {
      process.stdout.write(`\r  Progress: ${fileCount} files, ${dirCount} dirs`);
    }
  }
})) {
  // Just iterate, progress is tracked in callback
}
console.log(`\r  Final: ${fileCount} files, ${dirCount} directories`);

// Example 5: Include file stats (size, modified time, etc.)
console.log('\n5. Scan with file statistics:');
for await (const file of walker('./src', { withStats: true, maxDepth: 0 })) {
  if (file.stats) {
    const sizeKB = (file.stats.size / 1024).toFixed(2);
    const modifiedDate = file.stats.mtime.toISOString().split('T')[0];
    console.log(`  - ${file.dirent.name.padEnd(20)} ${sizeKB.padStart(8)} KB  (${modifiedDate})`);
  }
}

// Example 6: Combine multiple advanced features
console.log('\n6. Combined: Sort + Stats + Progress:');
let totalSize = 0;
let processedFiles = 0;

for await (const file of walker('./src', {
  withStats: true,
  sort: 'asc',
  onProgress: (entry) => {
    if (entry.stats) {
      totalSize += entry.stats.size;
      processedFiles++;
    }
  }
})) {
  if (file.stats) {
    const sizeKB = (file.stats.size / 1024).toFixed(2);
    console.log(`  - ${file.dirent.name} (${sizeKB} KB)`);
  }
}

console.log(`\n  Total: ${processedFiles} files, ${(totalSize / 1024).toFixed(2)} KB`);

console.log('\n=== Advanced Features Examples Complete ===');
