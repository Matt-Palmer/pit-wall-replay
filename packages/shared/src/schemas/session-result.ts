import { z } from "zod";

// A number of seconds, or a string such as "+1 LAP" for lapped cars
const gapValueSchema = z.union([z.number(), z.string()]).nullable();

export const sessionResultSchema = z.object({
  position: z.number().nullable(),
  driver_number: z.number(),
  number_of_laps: z.number().nullable(),
  // Not given for qualifying
  points: z.number().nullable().optional(),
  dnf: z.boolean(),
  dns: z.boolean(),
  dsq: z.boolean(),
  // Races give a single value, qualifying gives one per part (Q1, Q2, Q3)
  duration: z.union([z.number(), z.array(z.number().nullable())]).nullable(),
  gap_to_leader: z.union([gapValueSchema, z.array(gapValueSchema)]),
  meeting_key: z.number(),
  session_key: z.number(),
});

export const sessionResultsSchema = z.array(sessionResultSchema);

export type SessionResult = z.infer<typeof sessionResultSchema>;
export type SessionResults = z.infer<typeof sessionResultsSchema>;
