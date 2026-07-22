import { mkdir, writeFile } from 'node:fs/promises';
import railLine from '../examples/rail-line.json' with { type: 'json' };
import { defaultConfig, type LineDefinition } from '../src/core/models';
import { compareHeadways, simulate } from '../src/core/simulation';

const line = railLine as LineDefinition;
const config = { ...defaultConfig(line), durationMinutes: 180, seed: 20260722, disruption: { type: 'peak' as const, startMinute: 45, endMinute: 105, multiplier: 2.2 } };
const baseline = simulate(line, config);
const strategies = compareHeadways(line, config, [6, 8, 12]).map((result) => ({ headwayMinutes: result.config.headwayMinutes, ...result.metrics }));
await mkdir('dist-release', { recursive: true });
await writeFile('dist-release/demo-report.json', JSON.stringify({ generatedAt: new Date().toISOString(), line: line.name, config, baseline: baseline.metrics, strategies }, null, 2));
console.log(`Generated deterministic demo: ${baseline.metrics.trips} trips, ${baseline.metrics.boardedPassengers} boarded.`);
