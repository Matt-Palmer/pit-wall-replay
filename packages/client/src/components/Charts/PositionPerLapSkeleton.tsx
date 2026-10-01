import { Skeleton } from "../Skeleton/Skeleton";

import "../../styles/positionChart.css";

// Matches HEIGHT in PositionPerLapD3
const HEIGHT = 600;

function PositionPerLapSkeleton() {
  return (
    <div className="position-chart" aria-busy="true" aria-label="Loading position chart">
      <Skeleton height={HEIGHT} radius={8} />
    </div>
  );
}

export default PositionPerLapSkeleton;
