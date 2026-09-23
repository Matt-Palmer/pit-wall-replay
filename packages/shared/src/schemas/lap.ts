import { z } from "zod";
import type { Driver } from "./driver";

const nullableNumber = z.number().nullable();
const segmentsSectorSchema = z.array(nullableNumber).nullable();

export const lapSchema = z.object({
  date_start: z.iso.datetime({ offset: true }).nullable(),
  driver_number: z.number(),
  duration_sector_1: nullableNumber,
  duration_sector_2: nullableNumber,
  duration_sector_3: nullableNumber,
  i1_speed: nullableNumber,
  i2_speed: nullableNumber,
  is_pit_out_lap: z.boolean(),
  lap_duration: nullableNumber,
  lap_number: z.number(),
  meeting_key: z.number(),
  segments_sector_1: segmentsSectorSchema,
  segments_sector_2: segmentsSectorSchema,
  segments_sector_3: segmentsSectorSchema,
  session_key: z.number(),
  st_speed: nullableNumber,
});

export const lapsSchema = z.array(lapSchema);

export type Lap = z.infer<typeof lapSchema>;
export type LapWithDriver = Lap & { driver: Driver | undefined };
export type Laps = z.infer<typeof lapsSchema>;