import { z } from "zod";

// regex first: only plain digits get through, so "0x7E8" and " 2024" are rejected
export const yearParamsSchema = z.object({
	year: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(2023)),
});

export const sessionIdParamsSchema = z.object({
	id: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
});
