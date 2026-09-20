import { z } from "zod";

const dateTime = z.iso.datetime({ offset: true });

export const sessionSchema = z.object({
  circuit_key: z.number(),
  circuit_short_name: z.string(),
  circuit_code: z.string().optional(),
  country_key: z.number(),
  country_name: z.string(),
  date_end: dateTime,
  date_start: dateTime,
  gmt_offset: z.string(),
  is_cancelled: z.boolean(),
  location: z.string(),
  meeting_key: z.number(),
  session_key: z.number(),
  session_name: z.string(),
  session_type: z.string(),
  year: z.number(),
});

export const sessionsSchema = z.array(sessionSchema);

export type Session = z.infer<typeof sessionSchema>;
export type Sessions = z.infer<typeof sessionsSchema>;