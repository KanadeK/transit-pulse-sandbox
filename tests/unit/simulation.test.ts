import { describe, expect, it } from "vitest";
import busLine from "../../examples/bus-line.json";
import { defaultConfig, type LineDefinition } from "../../src/core/models";
import { compareHeadways, simulate } from "../../src/core/simulation";

const line = busLine as LineDefinition;

describe("discrete-event simulation", () => {
  it("is repeatable for a fixed seed", () => {
    const config = { ...defaultConfig(line), capacity: 30, seed: 77 };
    expect(simulate(line, config)).toEqual(simulate(line, config));
  });

  it("reduces waiting while increasing trips and energy when headways shrink", () => {
    const config = {
      ...defaultConfig(line),
      durationMinutes: 180,
      capacity: 200,
      seed: 4,
    };
    const [frequent, sparse] = compareHeadways(line, config, [6, 18]);
    expect(frequent.metrics.averageWaitMinutes).toBeLessThan(
      sparse.metrics.averageWaitMinutes,
    );
    expect(frequent.metrics.trips).toBeGreaterThan(sparse.metrics.trips);
    expect(frequent.metrics.energyKwh).toBeGreaterThan(
      sparse.metrics.energyKwh,
    );
  });

  it("leaves passengers behind when capacity cannot meet demand", () => {
    const constrained = simulate(line, {
      ...defaultConfig(line),
      durationMinutes: 120,
      capacity: 5,
      headwayMinutes: 20,
      seed: 9,
    });
    expect(constrained.metrics.strandedPassengers).toBeGreaterThan(0);
    expect(constrained.stops.some((snapshot) => snapshot.queued > 0)).toBe(
      true,
    );
  });

  it("applies a vehicle fault as a measurable delay", () => {
    const normal = simulate(line, { ...defaultConfig(line), seed: 12 });
    const fault = simulate(line, {
      ...defaultConfig(line),
      seed: 12,
      disruption: {
        type: "vehicle-fault",
        startMinute: 20,
        endMinute: 80,
        multiplier: 15,
      },
    });
    expect(fault.metrics.onTimeRate).toBeLessThan(normal.metrics.onTimeRate);
  });
});
