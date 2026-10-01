import type { Driver } from "../../../../shared/src/schemas/driver";

export type LineStyle = { stroke: string; strokeDasharray?: string };

// Team colour per driver; the second driver seen from each team gets a dashed line.
export function driverLineStyles(driversMap: Map<number, Driver>): Map<number, LineStyle> {
  const seenTeams = new Set<string>();
  const styles = new Map<number, LineStyle>();
  for (const driver of driversMap.values()) {
    const isSecond = seenTeams.has(driver.team_name);
    seenTeams.add(driver.team_name);
    styles.set(driver.driver_number, {
      stroke: `#${driver.team_colour}`,
      strokeDasharray: isSecond ? "5 5" : "0",
    });
  }
  return styles;
}
