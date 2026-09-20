import type { TyreCompound } from "@pitwall/shared";

export const TYRE_COMPOUND_COLOURS = {
  SOFT: "#FF0000",
  MEDIUM: "#FFFF00",
  HARD: "#FFFFFF",
  INTERMEDIATE: "#00FF00",
  WET: "#0000FF"
} satisfies Record<TyreCompound, string>;