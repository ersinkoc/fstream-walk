import walker from '../src/index.js';

console.log('=== Filtering Examples ===\n');

// Example 1: Filter by extension (RegExp)
console.log('1. Find all .js files:');
for await (const file of walker('.', {
  include: /\.js$/,
  exclude: 'node_modules',
  maxDepth: 2
})) {
  console.log(`  - ${file.path}`);
}

// Example 2: Filter by name pattern (String)
console.log('\n2. Find files containing "test":');
for await (const file of walker('.', {
  include: 'test',
  maxDepth: 2
})) {
  console.log(`  - ${file.path}`);
}

// Example 3: Custom filter function
console.log('\n3. Find files larger than 1KB (using custom function):');
for await (const file of walker('./src', {
  include: (name) => {
    // This is just filtering by name, but you could combine with stats
    return name.endsWith('.js');
  }
})) {
  console.log(`  - ${file.path}`);
}

// Example 4: Exclude multiple patterns
console.log('\n4. Exclude test and config files:');
for await (const file of walker('.', {
  exclude: /\.(test|spec|config)\.js$/,
  maxDepth: 2
})) {
  if (file.path.endsWith('.js')) {
    console.log(`  - ${file.path}`);
  }
}

console.log('\n=== Filtering Examples Complete ===');
