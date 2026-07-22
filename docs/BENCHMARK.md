# Benchmark

Measured on 2026-07-22 with Node v24.18.0 on Windows x64. The command was `npm run benchmark`; it executes the committed 12-stop synthetic rail line for 240 simulated minutes with a fixed peak event and seed `20260722`, 500 times in one process.

| Input                |                 Result |
| -------------------- | ---------------------: |
| Stops                |                     12 |
| Simulated departures | 15,000 across 500 runs |
| Total core time      |               24.17 ms |
| Mean per run         |              0.0483 ms |

This is a small deterministic-core benchmark, not a browser rendering or real-world capacity claim. Re-run it on another machine with `npm run benchmark`.
