import { ChangeEvent, useMemo, useState } from 'react';
import busLine from '../examples/bus-line.json';
import railLine from '../examples/rail-line.json';
import { defaultConfig, type Disruption, type LineDefinition, type SimulationConfig, type SimulationResult } from './core/models';
import { parseLineJson } from './adapters/line-json';
import { compareHeadways, simulate } from './core/simulation';
import { runInWorker } from './features/run-simulation';
import { TransitMap } from './features/TransitMap';
import { MetricChart } from './features/MetricChart';
import './styles.css';

const sampleBus = busLine as LineDefinition;
const sampleRail = railLine as LineDefinition;
const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export default function App() {
  const [line, setLine] = useState(sampleBus);
  const [config, setConfig] = useState<SimulationConfig>(defaultConfig(sampleBus));
  const [result, setResult] = useState<SimulationResult>(() => simulate(sampleBus, defaultConfig(sampleBus)));
  const [status, setStatus] = useState('Baseline simulation loaded.');
  const [error, setError] = useState('');
  const comparison = useMemo(() => compareHeadways(line, config, [Math.max(4, config.headwayMinutes - 4), config.headwayMinutes, config.headwayMinutes + 4]), [line, config]);
  const update = (changes: Partial<SimulationConfig>) => setConfig((current) => ({ ...current, ...changes }));
  const run = async (disruption: Disruption = config.disruption) => {
    setError(''); setStatus('Running deterministic simulation…');
    const next = { ...config, disruption };
    try { const nextResult = await runInWorker(line, next); setConfig(next); setResult(nextResult); setStatus(`Completed ${nextResult.metrics.trips} departures with seed ${next.seed}.`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Simulation failed.'); setStatus('Simulation failed.'); }
  };
  const selectLine = (next: LineDefinition) => { const nextConfig = defaultConfig(next); setLine(next); setConfig(nextConfig); setResult(simulate(next, nextConfig)); setStatus(`${next.name} loaded.`); };
  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { selectLine(parseLineJson(await file.text())); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Import failed.'); }
  };
  const peak: Disruption = { type: 'peak', startMinute: 30, endMinute: 90, multiplier: 2.5 };
  const fault: Disruption = { type: 'vehicle-fault', startMinute: 36, endMinute: 72, multiplier: 14 };
  return <main>
    <header><div><p className="eyebrow">OFFLINE · DETERMINISTIC · SYNTHETIC DATA</p><h1>Transit Pulse Sandbox</h1><p className="lead">Explore how frequency, capacity, delays and demand shocks change passenger experience and operating energy.</p></div><label className="upload">Import line JSON<input aria-label="Import line JSON" type="file" accept="application/json" onChange={importFile} /></label></header>
    <section className="controls" aria-label="Simulation controls"><button onClick={() => selectLine(sampleBus)}>6-stop bus</button><button onClick={() => selectLine(sampleRail)}>12-stop rail</button><label>Headway <output>{config.headwayMinutes} min</output><input aria-label="Headway minutes" type="range" min="4" max="24" value={config.headwayMinutes} onChange={(event) => update({ headwayMinutes: Number(event.target.value) })} /></label><label>Capacity <output>{config.capacity}</output><input aria-label="Vehicle capacity" type="range" min="5" max="220" value={config.capacity} onChange={(event) => update({ capacity: Number(event.target.value) })} /></label><button className="primary" onClick={() => run({ type: 'none' })}>Run baseline</button><button onClick={() => run(peak)}>Inject peak</button><button onClick={() => run(fault)}>Inject vehicle fault</button></section>
    <p role="status" className="status">{status}</p>{error && <p role="alert" className="error">{error}</p>}
    <section className="metrics" aria-label="Simulation metrics"><article><span>Average wait</span><strong>{result.metrics.averageWaitMinutes} min</strong></article><article><span>Crowding</span><strong>{formatPercent(result.metrics.crowdingRatio)}</strong></article><article><span>On-time</span><strong>{formatPercent(result.metrics.onTimeRate)}</strong></article><article><span>Energy proxy</span><strong>{result.metrics.energyKwh} kWh</strong></article><article><span>Left behind</span><strong>{result.metrics.strandedPassengers}</strong></article></section>
    <section className="dashboard"><TransitMap line={line} /><MetricChart result={result} /></section>
    <section className="comparison" aria-labelledby="strategy-title"><h2 id="strategy-title">Headway strategy comparison</h2><table><thead><tr><th>Headway</th><th>Wait</th><th>Trips</th><th>Energy</th><th>Left behind</th></tr></thead><tbody>{comparison.map((entry) => <tr key={entry.config.headwayMinutes}><td>{entry.config.headwayMinutes} min</td><td>{entry.metrics.averageWaitMinutes} min</td><td>{entry.metrics.trips}</td><td>{entry.metrics.energyKwh} kWh</td><td>{entry.metrics.strandedPassengers}</td></tr>)}</tbody></table></section>
  </main>;
}
