import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { least } from "d3-array";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";

import type { SessionTimeline } from "../../hooks/useSessionTimeline";
import type { Driver } from "../../../../shared/src/schemas/driver";
import { lapPositions, latestAtOrBefore } from "../../lib/timeline";
import type { LapPosition } from "../../lib/timeline";
import { driverLineStyles } from "./lineStyles";

import "../../styles/positionChart.css";

type PositionPerLapD3Props = {
  timeline: SessionTimeline;
  driversMap: Map<number, Driver>;
  t: number;
  totalLaps: number;
};

// inProgress marks the point part way through the lap currently being run
type Point = { driverNumber: number; lap: number; position: number; inProgress?: boolean };
type Series = { driverNumber: number; points: Point[] };

const HEIGHT = 600;
const MARGIN = { top: 20, right: 48, bottom: 30, left: 40 };
const LINE_WIDTH = 3;
const FADED_OPACITY = 0.15;

function PositionPerLapD3({ timeline, driversMap, t, totalLaps }: PositionPerLapD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState<Point | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const lineStyles = useMemo(() => driverLineStyles(driversMap), [driversMap]);
  const lapPositionsMap = useMemo(() => lapPositions(timeline), [timeline]);

  const series = useMemo(() => {
    const result: Series[] = [];
    for (const [driverNumber, lapPoints] of lapPositionsMap) {
      const points: Point[] = [];
      let prev: LapPosition | undefined;
      let next: LapPosition | undefined;
      for (const p of lapPoints) {
        if (p.t > t) {
          next = p;
          break;
        }
        if (p.lap === undefined || p.lap > totalLaps) continue;
        points.push({ driverNumber, lap: p.lap, position: p.position });
        prev = p;
      }

      // Lap points only change at the end of each lap, so between them the line is extended to
      // where the driver is part way through the current lap, at their position right now.
      // This keeps the chart in step with the driver list, which follows positions over time.
      const position = latestAtOrBefore(timeline.byDriver.get(driverNumber)?.positions ?? [], t)?.position;
      if (prev?.lap !== undefined && next?.lap !== undefined && next.lap <= totalLaps && position !== undefined) {
        const progress = (t - prev.t) / (next.t - prev.t);
        points.push({ driverNumber, lap: prev.lap + progress * (next.lap - prev.lap), position, inProgress: true });
      }

      if (points.length) result.push({ driverNumber, points });
    }
    return result;
  }, [lapPositionsMap, timeline, t, totalLaps]);

  const driverCount = timeline.byDriver.size;
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const x = useMemo(() => scaleLinear().domain([0, totalLaps]).range([0, innerWidth]), [totalLaps, innerWidth]);
  const y = useMemo(
    () => scaleLinear().domain([1, Math.max(driverCount, 2)]).range([0, innerHeight]),
    [driverCount, innerHeight],
  );
  const path = useMemo(
    () => line<Point>().x((d) => x(d.lap)).y((d) => y(d.position)),
    [x, y],
  );

  const allPoints = useMemo(() => series.flatMap((s) => s.points), [series]);
  const yTicks = Array.from({ length: driverCount }, (_, i) => i + 1);

  // Nearest point across every series, by screen distance (as in the Observable example).
  const onPointerMove = (e: PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const nearest = least(allPoints, (d) => (x(d.lap) - px) ** 2 + (y(d.position) - py) ** 2);
    setHovered(nearest ?? null);
  };

  // Hovered line is drawn last so it sits on top of the others.
  const ordered = hovered
    ? [
        ...series.filter((s) => s.driverNumber !== hovered.driverNumber),
        ...series.filter((s) => s.driverNumber === hovered.driverNumber),
      ]
    : series;

  const hoveredDriver = hovered ? driversMap.get(hovered.driverNumber) : undefined;
  const hoveredColour = hovered ? lineStyles.get(hovered.driverNumber)?.stroke : undefined;

  return (
    <div ref={containerRef} className="position-chart position-chart-d3">
      {width > 0 && (
        <svg width={width} height={HEIGHT}>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            <g className="position-chart-d3__grid">
              {yTicks.map((p) => (
                <line key={p} x1={0} x2={innerWidth} y1={y(p)} y2={y(p)} />
              ))}
            </g>

            <g className="position-chart-d3__axis">
              {yTicks.map((p) => (
                <text key={p} x={-10} y={y(p)} dy="0.32em" textAnchor="end">
                  {p}
                </text>
              ))}
              {x.ticks().map((lap) => (
                <text key={lap} x={x(lap)} y={innerHeight + 20} textAnchor="middle">
                  {lap}
                </text>
              ))}
            </g>

            {ordered.map(({ driverNumber, points }) => {
              const style = lineStyles.get(driverNumber);
              const faded = hovered !== null && hovered.driverNumber !== driverNumber;
              const last = points[points.length - 1]!;
              return (
                <g key={driverNumber} className="position-chart-d3__series" opacity={faded ? FADED_OPACITY : 1}>
                  <path
                    d={path(points) ?? undefined}
                    fill="none"
                    stroke={style?.stroke}
                    strokeDasharray={style?.strokeDasharray}
                    strokeWidth={LINE_WIDTH}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <text
                    className="position-chart-d3__end-label"
                    x={x(last.lap) + 8}
                    y={y(last.position)}
                    dy="0.32em"
                    fill={style?.stroke}
                  >
                    {driversMap.get(driverNumber)?.name_acronym ?? driverNumber}
                  </text>
                </g>
              );
            })}

            {hovered && (
              <circle cx={x(hovered.lap)} cy={y(hovered.position)} r={5} fill={hoveredColour} stroke="#fff" strokeWidth={1.5} />
            )}

            <rect
              width={innerWidth}
              height={innerHeight}
              fill="transparent"
              onPointerMove={onPointerMove}
              onPointerLeave={() => setHovered(null)}
            />
          </g>
        </svg>
      )}

      {hovered && (
        <div
          className="position-chart__tooltip position-chart-d3__tooltip"
          style={{ left: MARGIN.left + x(hovered.lap), top: MARGIN.top + y(hovered.position) }}
        >
          <strong style={{ color: hoveredColour }}>
            {hoveredDriver?.name_acronym ?? hovered.driverNumber}
          </strong>
          <div>
            {hovered.inProgress
              ? `Lap ${Math.floor(hovered.lap) + 1} (in progress): P${hovered.position}`
              : `Lap ${hovered.lap}: P${hovered.position}`}
          </div>
        </div>
      )}
    </div>
  );
}

export default PositionPerLapD3;
