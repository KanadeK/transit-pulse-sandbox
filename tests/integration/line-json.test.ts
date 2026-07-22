import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { parseLineJson } from "../../src/adapters/line-json";
import { defaultConfig } from "../../src/core/models";
import { simulate } from "../../src/core/simulation";

describe("line JSON adapter", () => {
  it("loads the committed 12-stop fixture into the real simulation", async () => {
    const text = await readFile("examples/rail-line.json", "utf8");
    const line = parseLineJson(text);
    const result = simulate(line, defaultConfig(line));
    expect(line.stops).toHaveLength(12);
    expect(result.metrics.boardedPassengers).toBeGreaterThan(0);
  });

  it("rejects malformed JSON and incomplete schedules", () => {
    expect(() => parseLineJson("{")).toThrow("not valid JSON");
    expect(() => parseLineJson(JSON.stringify({ id: "bad" }))).toThrow(
      "Invalid line definition",
    );
  });
});
