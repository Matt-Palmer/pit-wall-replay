import { z } from "zod";

const nullableNumber = z.number().nullable();

export const pitStopSchema = z.object({
  date: z.iso.datetime({ offset: true }),
  driver_number: z.number(),
  lane_duration: nullableNumber,
  lap_number: z.number(),
  meeting_key: z.number(),
  pit_duration: nullableNumber,
  session_key: z.number(),
  stop_duration: nullableNumber
});

export type PitStop = z.infer<typeof pitStopSchema>;