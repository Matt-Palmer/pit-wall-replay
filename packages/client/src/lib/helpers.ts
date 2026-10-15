import { TYRE_COMPOUND_COLOURS } from "../constants/compounds";
import type { TyreCompound } from "@pitwall/shared";

export class ApiError extends Error {
	status?: number;

	constructor(message: string, status?: number, options?: ErrorOptions) {
		super(message, options);
		this.name = "ApiError";
		this.status = status;
	}
}

export function shouldRetry(failureCount: number, error: Error) {
	if (failureCount >= 2) return false;
	if (error instanceof ApiError && error.status !== undefined) {
		if (error.status >= 400 && error.status < 500) {
			return error.status === 408 || error.status === 429;
		}
	}
	return true;
}

export function formatRaceTime(timeMs: number) {
	const totalSeconds = Math.floor(timeMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function getTyreColour(compound: TyreCompound | undefined) {
	if (!compound) return "#cccccc";
	return TYRE_COMPOUND_COLOURS[compound];
}