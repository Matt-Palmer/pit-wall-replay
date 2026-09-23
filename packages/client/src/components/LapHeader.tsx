import { memo } from "react";
import { flexRender, type Header } from "@tanstack/react-table";
import type { features } from "../lib/tableConfig";
import type { LapWithDriver } from "../../../shared/src/schemas/lap";

// Reads everything it needs off `header` itself (via the standalone
// `flexRender`, not `table.FlexRender`) rather than taking `table` as a prop.
// `useTable()` hands back a new `table` object on every render of the parent
// (see useTable.js - its return value is a useMemo keyed on the options
// object, which is a fresh literal each render), so a `table` prop would
// make this memo comparison fail every time regardless of what else changed.
const LapHeader = memo(function LapHeader({
	header,
	sortDir,
}: {
	header: Header<typeof features, LapWithDriver>;
	sortDir: string | boolean;
}) {
  return (
		<div
			onClick={header.column.getToggleSortingHandler()}
			style={{
				cursor: header.column.getCanSort() ? "pointer" : undefined,
				padding: "4px 8px",
				userSelect: "none",
        backgroundColor: "#1f1f1f"
			}}
		>
			{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
			{sortDir === "asc" && " ▲"}
			{sortDir === "desc" && " ▼"}
		</div>
	);
})

export default LapHeader;