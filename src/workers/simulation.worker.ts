import { simulate } from "../core/simulation";
import type { LineDefinition, SimulationConfig } from "../core/models";

self.onmessage = (
  event: MessageEvent<{ line: LineDefinition; config: SimulationConfig }>,
) => {
  try {
    self.postMessage({
      ok: true,
      result: simulate(event.data.line, event.data.config),
    });
  } catch (error) {
    self.postMessage({
      ok: false,
      error:
        error instanceof Error ? error.message : "Unknown simulation error",
    });
  }
};
