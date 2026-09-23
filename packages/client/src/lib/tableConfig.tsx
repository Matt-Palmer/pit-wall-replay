import type { LapWithDriver } from '../../../shared/src/schemas/lap';
import { tableFeatures, rowSortingFeature, createSortedRowModel, createColumnHelper } from '@tanstack/react-table';
// Register only the features this table needs. Sorting is actually two
// pieces: `rowSortingFeature` (state + column APIs like toggleSorting) and
// `sortedRowModel` (the row model that walks the data and produces sorted
// rows). Both are opt-in so a table that never sorts doesn't pay for either.
export const features = tableFeatures({
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
});

// The column helper is generic over the feature set (`typeof features`) so
// that column definitions get typed access to feature-specific options,
// e.g. `sortUndefined` below only exists because rowSortingFeature is
// registered.
export const columnHelper = createColumnHelper<typeof features, LapWithDriver>();

// Columns are defined once, at module scope. `columns` is a core input to
// useTable alongside `data` - a new array/object identity every render would
// invalidate the row models table-core memoizes internally.
export const columns = columnHelper.columns([
	columnHelper.accessor("driver_number", {
		header: "",
	}),
	columnHelper.accessor("driver.broadcast_name", {
		header: "Driver",
	}),
	columnHelper.accessor("lap_number", {
		header: "Lap",
	}),
	columnHelper.accessor("lap_duration", {
		header: "Lap Time",
		// lap_duration is `number | null` (no time set / invalid lap).
		// sortUndefined keeps those rows out of the way regardless of sort
		// direction, instead of writing a custom comparator to special-case null.
		sortUndefined: "last",
		cell: (info) => {
			const value = info.getValue();
			return value == null ? "—" : `${value.toFixed(3)}s`;
		},
	}),
]);

// Shared between the header row and body rows so their columns line up.
export const GRID_TEMPLATE_COLUMNS = "40px 1fr 100px 1fr";
