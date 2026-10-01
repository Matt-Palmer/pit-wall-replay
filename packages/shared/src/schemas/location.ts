import { z } from "zod";

export const locationSchema = z.object({
  date: z.iso.datetime({ offset: true }),
  driver_number: z.number(),
  meeting_key: z.number(),
  session_key: z.number(),
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const locationsSchema = z.array(locationSchema);

// A car's track, as parallel arrays to keep the payload small. t is epoch ms.
export const carTrackSchema = z.object({
  t: z.array(z.number()),
  x: z.array(z.number()),
  y: z.array(z.number()),
});

export const sessionLocationsSchema = z.object({
  // The circuit outline, taken from one clean lap
  track: z.object({
    x: z.array(z.number()),
    y: z.array(z.number()),
  }),
  // Keyed by driver number
  cars: z.record(z.string(), carTrackSchema),
});

export type Location = z.infer<typeof locationSchema>;
export type Locations = z.infer<typeof locationsSchema>;
export type CarTrack = z.infer<typeof carTrackSchema>;
export type SessionLocations = z.infer<typeof sessionLocationsSchema>;
