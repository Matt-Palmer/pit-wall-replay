import { z } from "zod";
import { TYRE_COMPOUNDS } from "../compounds";

const tyreCompoundEnum = z.enum(TYRE_COMPOUNDS);

export const stintSchema = z.object({
  compound: tyreCompoundEnum,
  driver_number: z.number(),
  lap_end: z.number().nullable(),
  lap_start: z.number(),
  meeting_key: z.number(),
  session_key: z.number(),
  stint_number: z.number(),
  tyre_age_at_start: z.number()
});

export type Stint = z.infer<typeof stintSchema>;