import { z } from 'zod';

export const meetingSchema = z.object({
  circuit_info_url: z.string(),
  circuit_image: z.string(),
  circuit_short_name: z.string(),
  circuit_type: z.string(),
  country_code: z.string(),
  country_flag: z.string(),
  country_key: z.number(),
  country_name: z.string(),
  date_end: z.string(),
  date_start: z.string(),
  gmt_offset: z.string(),
  is_cancelled: z.boolean(),
  location: z.string(),
  meeting_key: z.number(),
  meeting_name: z.string(),
  meeting_official_name: z.string(),
  year: z.number(),
});

export const meetingsSchema = z.array(meetingSchema);

export type Meeting = z.infer<typeof meetingSchema>;
export type Meetings = z.infer<typeof meetingsSchema>;