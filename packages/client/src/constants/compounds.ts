import type { TyreCompound } from "@pitwall/shared";

export const TYRE_COMPOUND_COLOURS = {
  SOFT: "#E8384F",
  MEDIUM: "#F5D33F",
  HARD: "#E6EAEE",
  INTERMEDIATE: "#43D17A",
  WET: "#4D8BFF"
} satisfies Record<TyreCompound, string>;