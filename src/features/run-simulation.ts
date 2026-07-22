import type {
  LineDefinition,
  SimulationConfig,
  SimulationResult,
} from "../core/models";

export function runInWorker(
  line: LineDefinition,
  config: SimulationConfig,
): Promise<SimulationResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/simulation.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (
      event: MessageEvent<{
        ok: boolean;
        result?: SimulationResult;
        error?: string;
      }>,
    ) => {
      worker.terminate();
      if (event.data.ok && event.data.result) resolve(event.data.result);
      else
        reject(
          new Error(
            event.data.error ?? "Worker did not return a simulation result.",
          ),
        );
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error("Simulation worker failed to start."));
    };
    worker.postMessage({ line, config });
  });
}
