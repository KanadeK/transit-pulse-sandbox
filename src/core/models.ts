import { z } from "zod";

export const StopSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  x: z.number(),
  y: z.number(),
  demandPerHour: z.number().nonnegative(),
});
export const LineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mode: z.enum(["bus", "rail"]),
  capacity: z.number().int().positive(),
  distanceKm: z.number().positive(),
  travelMinutesBetweenStops: z.number().positive(),
  stops: z.array(StopSchema).min(2),
});
export const DisruptionSchema = z.object({
  type: z.enum(["none", "peak", "vehicle-fault"]),
  startMinute: z.number().nonnegative().optional(),
  endMinute: z.number().positive().optional(),
  multiplier: z.number().positive().optional(),
});
export const SimulationConfigSchema = z.object({
  durationMinutes: z.number().int().positive(),
  headwayMinutes: z.number().positive(),
  capacity: z.number().int().positive(),
  baseDelayMinutes: z.number().nonnegative(),
  seed: z.number().int(),
  disruption: DisruptionSchema,
});
export type Stop = z.infer<typeof StopSchema>;
export type LineDefinition = z.infer<typeof LineSchema>;
export type Disruption = z.infer<typeof DisruptionSchema>;
export type SimulationConfig = z.infer<typeof SimulationConfigSchema>;
export type StopSnapshot = {
  stopId: string;
  minute: number;
  queued: number;
  boarded: number;
  occupancy: number;
};
export type TripSnapshot = {
  trip: number;
  scheduledMinute: number;
  actualMinute: number;
  delayMinutes: number;
  maxOccupancy: number;
  boarded: number;
  stranded: number;
};
export type Metrics = {
  averageWaitMinutes: number;
  crowdingRatio: number;
  onTimeRate: number;
  energyKwh: number;
  strandedPassengers: number;
  trips: number;
  boardedPassengers: number;
};
export type SimulationResult = {
  line: LineDefinition;
  config: SimulationConfig;
  metrics: Metrics;
  trips: TripSnapshot[];
  stops: StopSnapshot[];
};

export const defaultConfig = (line: LineDefinition): SimulationConfig => ({
  durationMinutes: 120,
  headwayMinutes: line.mode === "bus" ? 12 : 8,
  capacity: line.capacity,
  baseDelayMinutes: 1,
  seed: 20260722,
  disruption: { type: "none" },
});
