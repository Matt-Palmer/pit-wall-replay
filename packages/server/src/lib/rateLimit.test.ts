import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "./rateLimit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lets at most `limit` calls start per window, in order", async () => {
    const acquire = createRateLimiter(3, 1000);
    const started: number[] = [];
    const start = Date.now();

    const calls = Array.from({ length: 7 }, (_, i) => acquire().then(() => started.push(i)));

    await vi.advanceTimersByTimeAsync(0);
    expect(started).toEqual([0, 1, 2]);

    await vi.advanceTimersByTimeAsync(999);
    expect(started).toEqual([0, 1, 2]);

    await vi.advanceTimersByTimeAsync(1);
    expect(started).toEqual([0, 1, 2, 3, 4, 5]);

    await vi.advanceTimersByTimeAsync(1000);
    await Promise.all(calls);
    expect(started).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(Date.now() - start).toBe(2000);
  });

  it("does not delay calls spread out over time", async () => {
    const acquire = createRateLimiter(2, 1000);

    for (let i = 0; i < 4; i++) {
      let done = false;
      void acquire().then(() => (done = true));
      await vi.advanceTimersByTimeAsync(0);
      expect(done).toBe(true);
      await vi.advanceTimersByTimeAsync(500);
    }
  });
});
