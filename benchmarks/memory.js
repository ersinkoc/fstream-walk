import walker from '../src/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const BENCH_DIR = path.join(os.tmpdir(), 'fstream-walk-memory-' + Date.now());

function formatBytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external
  };
}

async function createLargeStructure() {
  console.log('Creating large directory structure for memory test...');
  await fs.mkdir(BENCH_DIR, { recursive: true });

  // Create 100 directories with 100 files each = 10,000 files
  for (let i = 0; i < 100; i++) {
    const dirPath = path.join(BENCH_DIR, `dir${i}`);
    await fs.mkdir(dirPath);

    for (let j = 0; j < 100; j++) {
      await fs.writeFile(
        path.join(dirPath, `file${j}.txt`),
        `content ${i}-${j}`
      );
    }
  }

  console.log('Created 100 directories with 100 files each (10,000 total files)');
}

async function cleanup() {
  await fs.rm(BENCH_DIR, { recursive: true, force: true });
}

async function testMemoryUsage() {
  await createLargeStructure();

  console.log('\n=== Memory Usage Test ===\n');

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const memBefore = getMemoryUsage();
  console.log('Memory before scan:');
  console.log(`  RSS:       ${formatBytes(memBefore.rss)}`);
  console.log(`  Heap Used: ${formatBytes(memBefore.heapUsed)}`);

  console.log('\nScanning 10,000 files using async iterator...');
  const startTime = performance.now();

  let count = 0;
  let maxHeap = memBefore.heapUsed;

  for await (const entry of walker(BENCH_DIR)) {
    count++;

    // Sample memory every 1000 files
    if (count % 1000 === 0) {
      const current = getMemoryUsage();
      maxHeap = Math.max(maxHeap, current.heapUsed);
      console.log(`  Processed ${count} files - Heap: ${formatBytes(current.heapUsed)}`);
    }
  }

  const endTime = performance.now();
  const memAfter = getMemoryUsage();

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const memAfterGC = getMemoryUsage();

  console.log(`\n✓ Scanned ${count} files in ${(endTime - startTime).toFixed(2)}ms`);

  console.log('\nMemory after scan:');
  console.log(`  RSS:       ${formatBytes(memAfter.rss)}`);
  console.log(`  Heap Used: ${formatBytes(memAfter.heapUsed)}`);
  console.log(`  Peak Heap: ${formatBytes(maxHeap)}`);

  console.log('\nMemory after GC:');
  console.log(`  RSS:       ${formatBytes(memAfterGC.rss)}`);
  console.log(`  Heap Used: ${formatBytes(memAfterGC.heapUsed)}`);

  const heapIncrease = memAfter.heapUsed - memBefore.heapUsed;
  console.log(`\nHeap increase: ${formatBytes(heapIncrease)}`);
  console.log(`Memory per file: ${(heapIncrease / count / 1024).toFixed(2)} KB`);

  // Compare with array approach
  console.log('\n--- Comparison: Loading all into array ---\n');

  if (global.gc) {
    global.gc();
  }

  const arrayMemBefore = getMemoryUsage();
  console.log('Memory before array scan:');
  console.log(`  Heap Used: ${formatBytes(arrayMemBefore.heapUsed)}`);

  const allFiles = [];
  const arrayStartTime = performance.now();

  for await (const entry of walker(BENCH_DIR)) {
    allFiles.push(entry);
  }

  const arrayEndTime = performance.now();
  const arrayMemAfter = getMemoryUsage();

  console.log(`\n✓ Loaded ${allFiles.length} files into array in ${(arrayEndTime - arrayStartTime).toFixed(2)}ms`);
  console.log('\nMemory after loading array:');
  console.log(`  Heap Used: ${formatBytes(arrayMemAfter.heapUsed)}`);

  const arrayHeapIncrease = arrayMemAfter.heapUsed - arrayMemBefore.heapUsed;
  console.log(`\nArray heap increase: ${formatBytes(arrayHeapIncrease)}`);
  console.log(`Memory per file (array): ${(arrayHeapIncrease / allFiles.length / 1024).toFixed(2)} KB`);

  const memoryDifference = arrayHeapIncrease - heapIncrease;
  console.log(`\n💾 Memory saved by streaming: ${formatBytes(memoryDifference)}`);
  console.log(`Efficiency: ${((1 - heapIncrease / arrayHeapIncrease) * 100).toFixed(1)}% less memory used`);

  await cleanup();
  console.log('\n✓ Memory test complete and cleaned up');
}

console.log('Note: Run with --expose-gc flag for accurate GC measurements');
console.log('Example: node --expose-gc benchmarks/memory.js\n');

testMemoryUsage().catch(console.error);
