import {
  LineSchema,
  SimulationConfigSchema,
  type LineDefinition,
  type SimulationConfig,
  type SimulationResult,
} from "./models";
import { seededRandom } from "./random";

const active = (minute: number, config: SimulationConfig): boolean => {
  const { disruption } = config;
  return (
    minute >= (disruption.startMinute ?? 0) &&
    minute <= (disruption.endMinute ?? config.durationMinutes)
  );
};

const demandFactor = (minute: number, config: SimulationConfig): number =>
  config.disruption.type === "peak" && active(minute, config)
    ? (config.disruption.multiplier ?? 2)
    : 1;
const faultDelay = (minute: number, config: SimulationConfig): number =>
  config.disruption.type === "vehicle-fault" && active(minute, config)
    ? (config.disruption.multiplier ?? 8)
    : 0;

export function simulate(
  rawLine: LineDefinition,
  rawConfig: SimulationConfig,
): SimulationResult {
  const line = LineSchema.parse(rawLine);
  const config = SimulationConfigSchema.parse(rawConfig);
  const random = seededRandom(config.seed);
  const queues = new Map(line.stops.map((stop) => [stop.id, 0]));
  const lastServed = new Map(line.stops.map((stop) => [stop.id, 0]));
  const stops: SimulationResult["stops"] = [];
  const trips: SimulationResult["trips"] = [];
  let totalWait = 0;
  let boardedTotal = 0;
  let strandedTotal = 0;
  let crowdingSum = 0;
  let onTime = 0;

  for (
    let scheduled = 0, trip = 0;
    scheduled < config.durationMinutes;
    scheduled += config.headwayMinutes, trip += 1
  ) {
    const jitter = Math.floor(random() * 3);
    const actual =
      scheduled +
      config.baseDelayMinutes +
      jitter +
      faultDelay(scheduled, config);
    let occupied = 0;
    let maxOccupancy = 0;
    let tripBoarded = 0;
    let tripStranded = 0;
    for (let index = 0; index < line.stops.length; index += 1) {
      const stop = line.stops[index];
      const serviceMinute = actual + index * line.travelMinutesBetweenStops;
      const elapsed = Math.max(
        0,
        serviceMinute - (lastServed.get(stop.id) ?? 0),
      );
      const arrivals = Math.round(
        (stop.demandPerHour / 60) *
          elapsed *
          demandFactor(serviceMinute, config),
      );
      const queued = (queues.get(stop.id) ?? 0) + arrivals;
      const alighting =
        index === line.stops.length - 1
          ? occupied
          : Math.floor(occupied * (0.08 + random() * 0.12));
      occupied -= alighting;
      const boarded = Math.min(queued, config.capacity - occupied);
      const remaining = queued - boarded;
      occupied += boarded;
      maxOccupancy = Math.max(maxOccupancy, occupied);
      queues.set(stop.id, remaining);
      lastServed.set(stop.id, serviceMinute);
      stops.push({
        stopId: stop.id,
        minute: serviceMinute,
        queued: remaining,
        boarded,
        occupancy: occupied,
      });
      totalWait += ((queued + remaining) * elapsed) / 2;
      tripBoarded += boarded;
      tripStranded += remaining;
      boardedTotal += boarded;
      strandedTotal += remaining;
      crowdingSum += occupied / config.capacity;
    }
    if (actual - scheduled <= 5) onTime += 1;
    trips.push({
      trip,
      scheduledMinute: scheduled,
      actualMinute: actual,
      delayMinutes: actual - scheduled,
      maxOccupancy,
      boarded: tripBoarded,
      stranded: tripStranded,
    });
  }
  const energyPerKm = line.mode === "rail" ? 4.6 : 1.35;
  const averageCrowding = crowdingSum / Math.max(stops.length, 1);
  return {
    line,
    config,
    trips,
    stops,
    metrics: {
      averageWaitMinutes: boardedTotal
        ? Number((totalWait / boardedTotal).toFixed(2))
        : 0,
      crowdingRatio: Number(averageCrowding.toFixed(3)),
      onTimeRate: Number((onTime / Math.max(trips.length, 1)).toFixed(3)),
      energyKwh: Number(
        (
          trips.length *
          line.distanceKm *
          energyPerKm *
          (1 + averageCrowding * 0.12)
        ).toFixed(2),
      ),
      strandedPassengers: strandedTotal,
      trips: trips.length,
      boardedPassengers: boardedTotal,
    },
  };
}

export function compareHeadways(
  line: LineDefinition,
  config: SimulationConfig,
  headways: number[],
): SimulationResult[] {
  return headways.map((headwayMinutes) =>
    simulate(line, { ...config, headwayMinutes }),
  );
}
