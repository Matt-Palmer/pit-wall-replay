export const TYRE_COMPOUNDS = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"] as const;
export type TyreCompound = (typeof TYRE_COMPOUNDS)[number];