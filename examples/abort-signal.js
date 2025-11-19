import walker from '../src/index.js';

console.log('=== AbortSignal Example ===\n');

// Create an AbortController
const controller = new AbortController();
const { signal } = controller;

// Set a timeout to abort after 100ms
setTimeout(() => {
  console.log('\n⚠️  Aborting scan...');
  controller.abort();
}, 100);

let count = 0;
console.log('Starting scan (will abort after 100ms)...\n');

try {
  for await (const file of walker('.', {
    signal,
    maxDepth: 5,
    exclude: 'node_modules'
  })) {
    console.log(`  - ${file.path}`);
    count++;

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 20));
  }
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('\n✓ Scan was successfully aborted');
  }
}

console.log(`\nProcessed ${count} files before abort`);
console.log('\n=== AbortSignal Example Complete ===');
