import { performance } from 'node:perf_hooks';
import railLine from '../examples/rail-line.json' with { type: 'json' };
import { defaultConfig, type LineDefinition } from '../src/core/models';
import { simulate } from '../src/core/simulation';

const line = railLine as LineDefinition;
const config = { ...defaultConfig(line), durationMinutes: 240, seed: 20260722, disruption: { type: 'peak' as const, startMinute: 60, endMinute: 150, multiplier: 2.2 } };
const iterations = 500;
const started = performance.now();
let trips = 0;
for (let index = 0; index < iterations; index += 1) trips += simulate(line, config).metrics.trips;
const elapsed = performance.now() - started;
console.log(JSON.stringify({ node: process.version, platform: `${process.platform}/${process.arch}`, stops: line.stops.length, durationMinutes: config.durationMinutes, iterations, trips, elapsedMs: Number(elapsed.toFixed(2)), averageMs: Number((elapsed / iterations).toFixed(4)) }, null, 2));
