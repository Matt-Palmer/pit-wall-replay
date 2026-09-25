import { z } from "zod";

export const positionSchema = z.object({
  date: z.iso.datetime({ offset: true }),
	position: z.number().min(1),
  meeting_key: z.number(),
  session_key: z.number(),
  driver_number: z.number(),
});

export const positionsSchema = z.array(positionSchema);

export type Position = z.infer<typeof positionSchema>;
export type Positions = z.infer<typeof positionsSchema>;