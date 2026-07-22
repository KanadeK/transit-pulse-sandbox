import { scaleLinear } from "d3-scale";
import type { SimulationResult } from "../core/models";

export function MetricChart({ result }: { result: SimulationResult }) {
  const width = 620;
  const height = 180;
  const pad = 26;
  const values = result.trips.map((trip) => trip.delayMinutes);
  const max = Math.max(...values, 1);
  const x = scaleLinear()
    .domain([0, Math.max(values.length - 1, 1)])
    .range([pad, width - pad]);
  const y = scaleLinear()
    .domain([0, max])
    .range([height - pad, pad]);
  const points = values
    .map((value, index) => `${x(index)},${y(value)}`)
    .join(" ");
  return (
    <section className="chart-card" aria-labelledby="delay-chart-title">
      <h2 id="delay-chart-title">Departure delay by trip</h2>
      <svg
        role="img"
        aria-label="Departure delay time series"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line
          x1={pad}
          y1={height - pad}
          x2={width - pad}
          y2={height - pad}
          className="axis"
        />
        <polyline
          fill="none"
          stroke="#ff8e72"
          strokeWidth="3"
          points={points}
        />
        {values.map((value, index) => (
          <circle
            key={index}
            cx={x(index)}
            cy={y(value)}
            r="3"
            fill="#ffd166"
          />
        ))}
      </svg>
    </section>
  );
}
