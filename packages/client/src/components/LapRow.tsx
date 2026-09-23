import { memo } from 'react';
import type { LapWithDriver } from '../../../shared/src/schemas/lap';
import type { Row } from '@tanstack/react-table';
import { features, GRID_TEMPLATE_COLUMNS } from '../lib/tableConfig';
import { flexRender } from '@tanstack/react-table';

const LapRow = memo(function LapRow({
	row,
  index,
	top,
	measureRef,
}: {
	row: Row<typeof features, LapWithDriver>;
  index: number;
	top: number;
	measureRef: (node: HTMLDivElement | null) => void;
}) {
	return (
		<div
			ref={measureRef}
			data-index={index}
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				transform: `translateY(${top}px)`,
				display: "grid",
        borderBottom: "1px solid #333",
        borderLeft: `4px solid #${row.original.driver?.team_colour}`,
				gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
			}}
		>
			{row.getAllCells().map((cell) => (
				<div key={cell.id} style={{ padding: "4px 8px" }}>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</div>
			))}
		</div>
	);
});

export default LapRow;