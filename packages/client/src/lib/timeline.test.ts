import { describe, expect, it } from 'vitest';
import { carPositionAt } from './timeline';

const car = {
  t: [1000, 2000, 10000],
  x: [0, 100, 500],
  y: [0, -50, 500],
};

describe('carPositionAt', () => {
  it('returns the sample exactly at t', () => {
    expect(carPositionAt(car, 2000)).toEqual({ x: 100, y: -50 });
  });

  it('interpolates between samples', () => {
    expect(carPositionAt(car, 1500)).toEqual({ x: 50, y: -25 });
  });

  it('holds the last point across a gap of more than 5 s', () => {
    expect(carPositionAt(car, 6000)).toEqual({ x: 100, y: -50 });
  });

  it('places the car at its first sample before it starts', () => {
    expect(carPositionAt(car, 0)).toEqual({ x: 0, y: 0 });
  });

  it('holds the last sample after the data ends', () => {
    expect(carPositionAt(car, 20000)).toEqual({ x: 500, y: 500 });
  });

  it('hides the car once it has stopped running', () => {
    expect(carPositionAt(car, 1999, 2000)).toBeDefined();
    expect(carPositionAt(car, 2000, 2000)).toBeUndefined();
  });

  it('returns undefined for a car with no samples', () => {
    expect(carPositionAt({ t: [], x: [], y: [] }, 1000)).toBeUndefined();
  });
});
