import { z } from "zod";

// A number of seconds, or a string such as "+1 LAP" for lapped cars
const gapSchema = z.union([z.number(), z.string()]).nullable();

export const intervalSchema = z.object({
  date: z.iso.datetime({ offset: true }),
  interval: gapSchema,
  gap_to_leader: gapSchema,
  session_key: z.number(),
  meeting_key: z.number(),
  driver_number: z.number(),
});

export const intervalsSchema = z.array(intervalSchema);

export type Interval = z.infer<typeof intervalSchema>;
export type Intervals = z.infer<typeof intervalsSchema>;