import { it, describe, expect } from 'vitest';
import { getTyreColour, formatGapOrInterval, formatTyreAge } from './helpers';
import type { TyreCompound } from '@pitwall/shared';

describe('getTyreColour', () => {
	it('should return the correct colour for a known compound', () => {
		const compound: TyreCompound = 'SOFT';
		const colour = getTyreColour(compound);
		expect(colour).toBe("#E8384F");
	});

	it('should return the default colour for an undefined compound', () => {
		const colour = getTyreColour(undefined);
		expect(colour).toBe('#cccccc');
	});
});

describe('formatGapOrInterval', () => {
	it('should return "Out" if outAt is defined', () => {
		const result = formatGapOrInterval(123, 1);
		expect(result).toBe('Out');
	});

  it('should return the "Out" if outAt is defined and value is null', () => {
		const result = formatGapOrInterval(null, 1);
		expect(result).toBe('Out');
	});

	it('should return "-" if value is null or 0 and outAt is undefined', () => {
		expect(formatGapOrInterval(null)).toBe('-');
		expect(formatGapOrInterval(0)).toBe('-');
	});

  it('should round numbers to three decimal places', () => {
		expect(formatGapOrInterval(1.23456)).toBe('+1.235');
	});

  it('should return the original value if that value is a string', () => {
		expect(formatGapOrInterval('+1 LAP')).toBe('+1 LAP');
	});
});

describe('formatTyreAge', () => {
	it('should return "-" if tyreAge is undefined', () => {
		expect(formatTyreAge(undefined)).toBe('-');
	});

  it('should return "-" if tyreAge is 0', () => {
		expect(formatTyreAge(0)).toBe("-");
	});

	it('should return "1 lap old" if tyreAge is 1', () => {
		expect(formatTyreAge(1)).toBe('1 lap old');
	});

	it('should return the correct string for tyreAge greater than 1', () => {
		expect(formatTyreAge(3)).toBe('3 laps old');
	});
});