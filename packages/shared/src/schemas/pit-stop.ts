import { z } from "zod";

export const pitStopSchema = z.object({
  date: z.iso.datetime(),
  driver_number: z.number(),
  lane_duration: z.number(),
  lap_number: z.number(),
  meeting_key: z.number(),
  pit_duration: z.number(),
  session_key: z.number(),
  stop_duration: z.number()
});

export type PitStop = z.infer<typeof pitStopSchema>;