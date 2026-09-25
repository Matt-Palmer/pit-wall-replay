import { z } from "zod";
import { TYRE_COMPOUNDS } from "../compounds";

const tyreCompoundEnum = z.enum(TYRE_COMPOUNDS).nullable();
const nullableNumber = z.number().nullable();

export const stintSchema = z.object({
  compound: tyreCompoundEnum,
  driver_number: z.number(),
  lap_end: nullableNumber,
  lap_start: nullableNumber,
  meeting_key: z.number(),
  session_key: z.number(),
  stint_number: z.number(),
  tyre_age_at_start: z.number()
});

export const stintsSchema = z.array(stintSchema);

export type Stint = z.infer<typeof stintSchema>;
export type Stints = z.infer<typeof stintsSchema>;