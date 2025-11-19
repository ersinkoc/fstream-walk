---
name: Performance Issue
about: Report a performance problem
title: '[PERF] '
labels: performance
assignees: ''
---

## Performance Issue Description
Describe the performance problem you're experiencing.

## Scenario
What were you trying to do?

```javascript
// Your code that exhibits the performance issue
import walker from 'fstream-walk';

for await (const file of walker('./large-directory', {
  // options
})) {
  // ...
}
```

## Measurements
Provide measurements if available:

- **Directory size**: (e.g., 10,000 files, 1GB)
- **Execution time**: (e.g., 5 seconds)
- **Memory usage**: (e.g., 500MB)
- **Expected performance**: (e.g., should complete in 1 second)

## Environment
- **Node.js version**: (e.g., v18.0.0)
- **fstream-walk version**: (e.g., 1.0.0)
- **Operating System**: (e.g., Ubuntu 22.04)
- **File system**: (e.g., ext4, NTFS, APFS)

## Benchmark Results
If you've run benchmarks, please share the results:

```bash
npm run bench
# paste output here
```

## Additional Context
Any additional information that might help diagnose the issue.
