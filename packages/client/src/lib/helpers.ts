export class ApiError extends Error {
	status?: number;

	constructor(message: string, status?: number, options?: ErrorOptions) {
		super(message, options);
		this.name = "ApiError";
		this.status = status;
	}
}

export function shouldRetry(failureCount: number, error: Error) {
  console.log(`Retry attempt ${failureCount} for error:`, error);
  if (failureCount >= 2) return false;
  if (error instanceof ApiError && error.status !== undefined) {
    if (error.status >= 400 && error.status < 500) {
      return error.status === 408 || error.status === 429;
    }
  }
  return true;
}