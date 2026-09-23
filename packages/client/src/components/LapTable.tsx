import { useMemo, useRef } from "react";
import { useTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { features, columns, GRID_TEMPLATE_COLUMNS } from "../lib/tableConfig";
import type { LapWithDriver } from '../../../shared/src/schemas/lap';
import LapRow from "./LapRow";
import TableHeader from "./LapHeader";

const INITIAL_STATE = { sorting: [{ id: "driver_number", desc: false }] };

function LapTable({ filteredLaps }: { filteredLaps: LapWithDriver[] }) {
  const parentRef = useRef<HTMLDivElement | null>(null);

	const tableOptions = useMemo(
		() => ({ features, columns, data: filteredLaps, initialState: INITIAL_STATE }),
		[filteredLaps],
	);
  const table = useTable(tableOptions);

	const { rows } = table.getRowModel();

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 35,
		getItemKey: (index) => rows[index]?.id ?? index,
		overscan: 10,
	});

  return (
		<div
			ref={parentRef}
			style={{ height: 600, overflow: "auto"}}
		>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
					position: "sticky",
					top: 0,
					fontWeight: "bold",
					zIndex: 1,
				}}
			>
				{table.getHeaderGroups().map((headerGroup) =>
					headerGroup.headers.map((header) => {
						const sortDir = header.column.getIsSorted();
						return (
							<TableHeader
								key={header.id}
								header={header}
								sortDir={sortDir}
							/>
						);
					}),
				)}
			</div>

			<div
				style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}
			>
				{rowVirtualizer.getVirtualItems().map((virtualRow) => {
					const row = rows[virtualRow.index];
					if (!row) return null;
					return (
						<LapRow
							key={row.id}
							row={row}
              index={virtualRow.index}
							top={virtualRow.start}
							measureRef={rowVirtualizer.measureElement}
						/>
					);
				})}
			</div>
		</div>
	);
}

export default LapTable;