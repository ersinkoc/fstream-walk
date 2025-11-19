import walker from '../src/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';

console.log('=== Advanced Usage Examples ===\n');

// Example 1: Count files by extension
console.log('1. Count files by extension:');
const extensions = {};
for await (const file of walker('./src')) {
  const ext = path.extname(file.path) || 'no-extension';
  extensions[ext] = (extensions[ext] || 0) + 1;
}
console.log(extensions);

// Example 2: Find largest files
console.log('\n2. Find files and their sizes:');
const filesWithSize = [];
for await (const file of walker('./src')) {
  try {
    const stats = await fs.stat(file.path);
    filesWithSize.push({ path: file.path, size: stats.size });
  } catch (e) {
    // Skip if can't read stats
  }
}
filesWithSize.sort((a, b) => b.size - a.size);
filesWithSize.slice(0, 5).forEach(f => {
  console.log(`  ${f.size.toString().padStart(6)} bytes - ${f.path}`);
});

// Example 3: Build directory tree structure
console.log('\n3. Directory tree structure:');
const tree = {};
for await (const entry of walker('./src', { yieldDirectories: true, maxDepth: 2 })) {
  const parts = entry.path.split(path.sep);
  let current = tree;
  for (const part of parts) {
    if (!current[part]) current[part] = {};
    current = current[part];
  }
}
console.log(JSON.stringify(tree, null, 2));

// Example 4: Parallel processing with limited concurrency
console.log('\n4. Process files with limited concurrency:');
const CONCURRENCY_LIMIT = 3;
const queue = [];
let processed = 0;

async function processFile(filePath) {
  // Simulate async processing
  await new Promise(resolve => setTimeout(resolve, 10));
  return filePath;
}

for await (const file of walker('./src')) {
  const task = processFile(file.path).then(result => {
    processed++;
    console.log(`  Processed: ${result}`);
  });

  queue.push(task);

  if (queue.length >= CONCURRENCY_LIMIT) {
    await Promise.race(queue);
    queue.splice(queue.findIndex(p => p), 1);
  }
}

// Wait for remaining tasks
await Promise.all(queue);
console.log(`\nTotal processed: ${processed} files`);

console.log('\n=== Advanced Usage Examples Complete ===');
