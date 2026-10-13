import { useMemo } from 'react';
import { extent } from 'd3-array';
import { curveCatmullRomClosed, line } from 'd3-shape';

import type { Driver, SessionLocations } from '@pitwall/shared';
import { carPositionAt } from '../../lib/timeline';

import '../../styles/trackMap.css';

type TrackMapProps = {
  locations: SessionLocations;
  driversMap: Map<number, Driver>;
  stoppedAt: Map<number, number>;
  // Absolute time in epoch ms
  t: number;
  hoveredDriver: number | null;
  selectedDriver: number | null;
  onHoverDriver: (driverNumber: number | null) => void;
  onSelectDriver: (driverNumber: number) => void;
};

type Car = { driverNumber: number; driver: Driver | undefined; x: number; y: number };

// Sizes are in track units, as a share of the circuit's larger side, so cars look the same on every circuit
const PADDING_RATIO = 0.05;
const CAR_RADIUS_RATIO = 0.012;

// OpenF1's y axis points up and SVG's points down, so y is negated throughout
const toPoint = (x: number, y: number): [number, number] => [x, -y];

function TrackMap({ locations, driversMap, stoppedAt, t, hoveredDriver, selectedDriver, onHoverDriver, onSelectDriver }: TrackMapProps) {
  const { track } = locations;

  const { path, viewBox, radius } = useMemo(() => {
    const points = track.x.map((x, i) => toPoint(x, track.y[i]!));
    // Fall back to the cars' own samples if there was no clean lap to draw the circuit from
    const boundsX = points.length ? track.x : Object.values(locations.cars).flatMap((car) => car.x);
    const boundsY = points.length ? track.y.map((y) => -y) : Object.values(locations.cars).flatMap((car) => car.y.map((y) => -y));

    const [minX = 0, maxX = 0] = extent(boundsX);
    const [minY = 0, maxY = 0] = extent(boundsY);
    const size = Math.max(maxX - minX, maxY - minY) || 1;
    const pad = size * PADDING_RATIO;

    return {
      path: points.length ? line().curve(curveCatmullRomClosed)(points) ?? undefined : undefined,
      viewBox: `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`,
      radius: size * CAR_RADIUS_RATIO,
    };
  }, [track, locations.cars]);

  const { cars, hasMissingCars } = useMemo(() => {
    const result: Car[] = [];
    // Cars still running but without location data at t, as opposed to cars that have stopped
    let missing = 0;
    for (const [key, car] of Object.entries(locations.cars)) {
      const driverNumber = Number(key);
      const carStoppedAt = stoppedAt.get(driverNumber);
      const position = carPositionAt(car, t, carStoppedAt);
      if (!position) {
        if (carStoppedAt === undefined || t < carStoppedAt) missing++;
        continue;
      }
      const [x, y] = toPoint(position.x, position.y);
      result.push({ driverNumber, driver: driversMap.get(driverNumber), x, y });
    }
    return { cars: result, hasMissingCars: missing > 0 };
  }, [locations.cars, t, stoppedAt, driversMap]);

  const hoveredCar = cars.find((car) => car.driverNumber === hoveredDriver);
  const selectedCar = cars.find((car) => car.driverNumber === selectedDriver);

  return (
		<>
			<svg
				className="track-map"
				viewBox={viewBox}
				role="img"
				aria-label="Car positions on the circuit"
			>
				{path && <path className="track-map__track" d={path} />}

				{cars.map((car) => (
					<g
						key={car.driverNumber}
						className="track-map__car"
						transform={`translate(${car.x} ${car.y})`}
						style={
							{
								"--team-colour": `#${car.driver?.team_colour ?? "cccccc"}`,
							} as React.CSSProperties
						}
						onPointerEnter={() => onHoverDriver(car.driverNumber)}
						onPointerLeave={() => onHoverDriver(null)}
						onClick={() => onSelectDriver(car.driverNumber)}
					>
						<title>{car.driver?.full_name ?? car.driverNumber}</title>
						<circle r={radius} />
					</g>
				))}

				{/* Drawn again on top of the rest; a copy rather than reordering, so the pointer target never moves in the DOM */}
				{hoveredCar && (
					<g
						className="track-map__car track-map__car--highlighted"
						transform={`translate(${hoveredCar.x} ${hoveredCar.y})`}
						style={
							{
								"--team-colour": `#${hoveredCar.driver?.team_colour ?? "cccccc"}`,
							} as React.CSSProperties
						}
						aria-hidden="true"
					>
						<circle r={radius} />
						<text x={radius * 2} y={radius * 0.6} fontSize={radius * 2.2}>
							{hoveredCar.driver?.name_acronym ?? hoveredCar.driverNumber}
						</text>
					</g>
				)}

				{selectedCar && (
					<g
						className="track-map__car track-map__car--highlighted"
						transform={`translate(${selectedCar.x} ${selectedCar.y})`}
						style={
							{
								"--team-colour": `#${selectedCar.driver?.team_colour ?? "cccccc"}`,
							} as React.CSSProperties
						}
						aria-hidden="true"
					>
						<circle r={radius} />
						<text x={radius * 2} y={radius * 0.6} fontSize={radius * 2.2}>
							{selectedCar.driver?.name_acronym ?? selectedCar.driverNumber}
						</text>
					</g>
				)}
			</svg>

			{cars.length === 0 && hasMissingCars && (
				<div className="track-map__notice">No location data at this point</div>
			)}
		</>
	);
}

export default TrackMap;
