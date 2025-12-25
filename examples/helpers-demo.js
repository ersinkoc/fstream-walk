import {
  findFiles,
  countFiles,
  calculateSize,
  getLargestFiles,
  buildTree,
  findDuplicateNames,
  groupByExtension
} from '../dist/helpers.js';

console.log('=== Helper Functions Demo ===\n');

// Example 1: Find all JavaScript files
console.log('1. Find all JavaScript files:');
const jsFiles = await findFiles('./src', { include: /\.js$/ });
console.log(`Found ${jsFiles.length} JavaScript files`);
jsFiles.forEach(f => console.log(`  - ${f}`));

// Example 2: Count files by extension
console.log('\n2. Count files by extension:');
const breakdown = await countFiles('./src', { byExtension: true });
console.log(JSON.stringify(breakdown, null, 2));

// Example 3: Calculate total size
console.log('\n3. Calculate directory size:');
const sizeInfo = await calculateSize('./src');
console.log(`  Total size: ${sizeInfo.totalSizeKB} KB (${sizeInfo.totalSizeMB} MB)`);
console.log(`  File count: ${sizeInfo.fileCount}`);
console.log(`  Average file size: ${sizeInfo.averageSize} bytes`);

// Example 4: Get largest files
console.log('\n4. Top 5 largest files:');
const largest = await getLargestFiles('./src', { limit: 5 });
largest.forEach((f, i) => {
  console.log(`  ${i + 1}. ${f.path.split('/').pop().padEnd(20)} ${f.sizeKB.padStart(8)} KB`);
});

// Example 5: Build directory tree
console.log('\n5. Directory tree structure:');
const tree = await buildTree('./src', { maxDepth: 1 });
console.log(JSON.stringify(tree, null, 2));

// Example 6: Find duplicate filenames
console.log('\n6. Find duplicate filenames:');
const dupes = await findDuplicateNames('./');
const hasDupes = Object.keys(dupes).length > 0;
if (hasDupes) {
  Object.entries(dupes).forEach(([name, paths]) => {
    console.log(`  "${name}" appears in ${paths.length} locations:`);
    paths.forEach(p => console.log(`    - ${p}`));
  });
} else {
  console.log('  No duplicate filenames found');
}

// Example 7: Group files by extension
console.log('\n7. Group files by extension:');
const groups = await groupByExtension('./src');
Object.entries(groups).forEach(([ext, files]) => {
  console.log(`  ${ext}: ${files.length} file(s)`);
});

console.log('\n=== Helper Functions Demo Complete ===');
