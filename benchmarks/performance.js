import walker from '../dist/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Create a large test directory structure
const BENCH_DIR = path.join(os.tmpdir(), 'fstream-walk-bench-' + Date.now());
const NUM_DIRS = 20;
const FILES_PER_DIR = 50;

async function createBenchStructure() {
  console.log('Creating benchmark directory structure...');
  await fs.mkdir(BENCH_DIR, { recursive: true });

  for (let i = 0; i < NUM_DIRS; i++) {
    const dirPath = path.join(BENCH_DIR, `dir${i}`);
    await fs.mkdir(dirPath, { recursive: true });

    for (let j = 0; j < FILES_PER_DIR; j++) {
      const ext = j % 3 === 0 ? '.js' : j % 3 === 1 ? '.txt' : '.json';
      await fs.writeFile(
        path.join(dirPath, `file${j}${ext}`),
        `content for file ${j}`
      );
    }

    // Create nested subdirectory
    if (i % 3 === 0) {
      const subDir = path.join(dirPath, 'nested');
      await fs.mkdir(subDir);
      for (let k = 0; k < 10; k++) {
        await fs.writeFile(path.join(subDir, `nested${k}.md`), 'nested content');
      }
    }
  }

  console.log(`Created ${NUM_DIRS} directories with ~${FILES_PER_DIR} files each`);
}

async function cleanup() {
  await fs.rm(BENCH_DIR, { recursive: true, force: true });
}

async function benchmark(name, fn) {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = (end - start).toFixed(2);
  console.log(`\n${name}`);
  console.log(`  Time: ${duration}ms`);
  console.log(`  Result: ${result}`);
  return { name, duration, result };
}

async function runBenchmarks() {
  await createBenchStructure();

  console.log('\n=== Performance Benchmarks ===\n');

  const results = [];

  // Benchmark 1: Full recursive scan
  results.push(await benchmark('1. Full recursive scan (no filters)', async () => {
    let count = 0;
    for await (const entry of walker(BENCH_DIR)) {
      count++;
    }
    return `${count} files`;
  }));

  // Benchmark 2: With regex filter
  results.push(await benchmark('2. Scan with regex filter (/\\.js$/)', async () => {
    let count = 0;
    for await (const entry of walker(BENCH_DIR, { include: /\.js$/ })) {
      count++;
    }
    return `${count} files`;
  }));

  // Benchmark 3: With string filter
  results.push(await benchmark('3. Scan with string filter ("file1")', async () => {
    let count = 0;
    for await (const entry of walker(BENCH_DIR, { include: 'file1' })) {
      count++;
    }
    return `${count} files`;
  }));

  // Benchmark 4: With maxDepth
  results.push(await benchmark('4. Scan with maxDepth=1', async () => {
    let count = 0;
    for await (const entry of walker(BENCH_DIR, { maxDepth: 1 })) {
      count++;
    }
    return `${count} files`;
  }));

  // Benchmark 5: With exclude filter
  results.push(await benchmark('5. Scan with exclude filter ("nested")', async () => {
    let count = 0;
    for await (const entry of walker(BENCH_DIR, { exclude: 'nested' })) {
      count++;
    }
    return `${count} files`;
  }));

  // Benchmark 6: Yield directories
  results.push(await benchmark('6. Scan with yieldDirectories=true', async () => {
    let fileCount = 0;
    let dirCount = 0;
    for await (const entry of walker(BENCH_DIR, { yieldDirectories: true })) {
      if (entry.dirent.isDirectory()) dirCount++;
      else fileCount++;
    }
    return `${fileCount} files, ${dirCount} dirs`;
  }));

  // Benchmark 7: Early abort
  results.push(await benchmark('7. Scan with early abort (after 100 files)', async () => {
    let count = 0;
    const controller = new AbortController();
    for await (const entry of walker(BENCH_DIR, { signal: controller.signal })) {
      count++;
      if (count >= 100) controller.abort();
    }
    return `${count} files (aborted)`;
  }));

  // Benchmark 8: Compare with readdir approach
  results.push(await benchmark('8. Baseline: fs.readdir recursive', async () => {
    let count = 0;
    async function readDirRecursive(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await readDirRecursive(fullPath);
        } else {
          count++;
        }
      }
    }
    await readDirRecursive(BENCH_DIR);
    return `${count} files`;
  }));

  console.log('\n=== Summary ===\n');
  results.forEach(r => {
    console.log(`${r.name.padEnd(50)} ${r.duration.padStart(8)}ms`);
  });

  await cleanup();
  console.log('\n✓ Benchmark complete and cleaned up');
}

// Run benchmarks
runBenchmarks().catch(console.error);
