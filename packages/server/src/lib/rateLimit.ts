export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Returns an acquire function that resolves once a call may start, allowing at most `limit` starts in any `windowMs` window.
// Callers are served in the order they asked.
export function createRateLimiter(limit: number, windowMs: number) {
  const starts: number[] = [];
  let queue = Promise.resolve();

  async function waitForSlot(): Promise<void> {
    const now = Date.now();
    while (starts.length && now - starts[0]! >= windowMs) starts.shift();

    if (starts.length >= limit) {
      await sleep(starts[0]! + windowMs - now);
      return waitForSlot();
    }

    starts.push(now);
  }

  return function acquire(): Promise<void> {
    queue = queue.then(waitForSlot);
    return queue;
  };
}
