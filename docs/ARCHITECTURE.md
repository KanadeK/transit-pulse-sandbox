# Architecture

`src/core` owns deterministic domain schemas, simulation and metrics. `src/adapters` validates JSON imports. `src/features` renders and coordinates user actions. `src/workers` makes the pure core available to a Web Worker. The UI never invents metrics: every displayed series comes from `SimulationResult`.
