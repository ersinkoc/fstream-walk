import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import walker from '../src/index.js';

const STRESS_DIR = path.join(os.tmpdir(), 'fstream-stress-' + Date.now());

async function createLargeStructure(numDirs = 50, filesPerDir = 100) {
  await fs.mkdir(STRESS_DIR, { recursive: true });

  for (let i = 0; i < numDirs; i++) {
    const dirPath = path.join(STRESS_DIR, `dir${i}`);
    await fs.mkdir(dirPath);

    for (let j = 0; j < filesPerDir; j++) {
      await fs.writeFile(
        path.join(dirPath, `file${j}.txt`),
        `content ${i}-${j}`
      );
    }
  }
}

async function cleanup() {
  try {
    await fs.rm(STRESS_DIR, { recursive: true, force: true });
  } catch (err) {
    // Ignore cleanup errors
  }
}

describe('Stress Tests', () => {
  test('should handle 5000 files efficiently', async () => {
    await createLargeStructure(50, 100);

    const startTime = performance.now();
    const startMem = process.memoryUsage().heapUsed;

    let count = 0;
    for await (const file of walker(STRESS_DIR)) {
      count++;
    }

    const endTime = performance.now();
    const endMem = process.memoryUsage().heapUsed;
    const duration = endTime - startTime;
    const memIncrease = (endMem - startMem) / 1024 / 1024;

    console.log(`  Processed ${count} files in ${duration.toFixed(2)}ms`);
    console.log(`  Memory increase: ${memIncrease.toFixed(2)}MB`);

    assert.strictEqual(count, 5000);
    assert.ok(duration < 5000, 'Should complete in under 5 seconds');
    assert.ok(memIncrease < 100, 'Should use less than 100MB');

    await cleanup();
  });

  test('should handle deep nesting (50 levels)', async () => {
    let currentPath = STRESS_DIR;
    for (let i = 0; i < 50; i++) {
      currentPath = path.join(currentPath, `level${i}`);
      await fs.mkdir(currentPath, { recursive: true });
    }
    await fs.writeFile(path.join(currentPath, 'deep.txt'), 'very deep');

    let count = 0;
    for await (const file of walker(STRESS_DIR)) {
      count++;
    }

    assert.strictEqual(count, 1);

    await cleanup();
  });

  test('should handle early abort without leaking', async () => {
    await createLargeStructure(100, 100); // 10,000 files

    const controller = new AbortController();
    let count = 0;

    for await (const file of walker(STRESS_DIR, { signal: controller.signal })) {
      count++;
      if (count >= 100) {
        controller.abort();
      }
    }

    assert.strictEqual(count, 100);

    await cleanup();
  });

  test('should maintain constant memory with sorting disabled', async () => {
    await createLargeStructure(50, 100);

    const memSamples = [];

    for await (const file of walker(STRESS_DIR)) {
      if (Math.random() < 0.01) { // Sample 1% of files
        memSamples.push(process.memoryUsage().heapUsed);
      }
    }

    // Memory should not grow significantly over time
    const firstQuarter = memSamples.slice(0, Math.floor(memSamples.length / 4));
    const lastQuarter = memSamples.slice(-Math.floor(memSamples.length / 4));

    const avgFirst = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
    const avgLast = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;

    const growthPercentage = ((avgLast - avgFirst) / avgFirst) * 100;

    console.log(`  Memory growth: ${growthPercentage.toFixed(2)}%`);
    assert.ok(growthPercentage < 50, 'Memory should not grow more than 50%');

    await cleanup();
  });
});
