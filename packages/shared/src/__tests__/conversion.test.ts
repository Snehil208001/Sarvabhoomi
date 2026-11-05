import { describe, it, expect } from 'vitest';
import {
  toSqFt,
  fromSqFt,
  formatArea,
  formatPriceNPR,
  formatPricePerUnit,
  SQFT_PER_UNIT,
} from '../units/conversion';

describe('Nepal Land Unit Conversions', () => {
  it('correctly maps square feet per standard Nepal unit', () => {
    expect(SQFT_PER_UNIT.ROPANI).toBe(5476);
    expect(SQFT_PER_UNIT.AANA).toBe(342.25);
    expect(SQFT_PER_UNIT.BIGHA).toBe(72900);
    expect(SQFT_PER_UNIT.KATTHA).toBe(3645);
    expect(SQFT_PER_UNIT.SQFT).toBe(1);
  });

  it('converts units to square feet accurately', () => {
    // 1 Ropani = 5476 sq ft
    expect(toSqFt(1, 'ROPANI')).toBe(5476);
    // 16 Aana = 1 Ropani = 5476 sq ft
    expect(toSqFt(16, 'AANA')).toBe(5476);
    // 1 Bigha = 72900 sq ft
    expect(toSqFt(1, 'BIGHA')).toBe(72900);
    // 20 Kattha = 1 Bigha = 72900 sq ft
    expect(toSqFt(20, 'KATTHA')).toBe(72900);
    // 4 Aana
    expect(toSqFt(4, 'AANA')).toBe(1369);
  });

  it('converts square feet back to target units', () => {
    expect(fromSqFt(5476, 'ROPANI')).toBe(1);
    expect(fromSqFt(5476, 'AANA')).toBe(16);
    expect(fromSqFt(72900, 'BIGHA')).toBe(1);
    expect(fromSqFt(72900, 'KATTHA')).toBe(20);
  });

  it('handles zero and invalid inputs safely', () => {
    expect(toSqFt(0, 'AANA')).toBe(0);
    expect(toSqFt(NaN, 'ROPANI')).toBe(0);
    expect(fromSqFt(0, 'KATTHA')).toBe(0);
    expect(fromSqFt(NaN, 'BIGHA')).toBe(0);
  });

  it('formats area strings in English and Nepali', () => {
    const formattedEn = formatArea(4, 'AANA', 'en', { includeSqft: true });
    expect(formattedEn).toContain('4 Aana');
    expect(formattedEn).toContain('1,369 sq ft');

    const formattedNe = formatArea(4, 'AANA', 'ne', { includeSqft: true });
    expect(formattedNe).toContain('4 आना');
    expect(formattedNe).toContain('वर्ग फिट');

    // Without sqft subtitle
    expect(formatArea(2, 'ROPANI', 'en', { includeSqft: false })).toBe('2 Ropani');
  });
});

describe('Nepal Price Formatting (Lakh / Crore / NPR)', () => {
  it('formats prices under 1 Lakh with comma separation', () => {
    expect(formatPriceNPR(50000, 'en')).toBe('Rs. 50,000');
    expect(formatPriceNPR(50000, 'ne')).toBe('रु 50,000');
  });

  it('formats Lakhs correctly', () => {
    expect(formatPriceNPR(3500000, 'en')).toBe('Rs. 35 Lakh');
    expect(formatPriceNPR(3550000, 'en')).toBe('Rs. 35.50 Lakh');
    expect(formatPriceNPR(8000000, 'ne')).toBe('रु 80 लाख');
  });

  it('formats Crores correctly', () => {
    expect(formatPriceNPR(10000000, 'en')).toBe('Rs. 1 Cr');
    expect(formatPriceNPR(25000000, 'en')).toBe('Rs. 2.50 Cr');
    expect(formatPriceNPR(125000000, 'ne')).toContain('करोड');
  });

  it('formats price per unit correctly', () => {
    const perUnit = formatPricePerUnit(14000000, 4, 'AANA', 'en');
    expect(perUnit).toBe('Rs. 35 Lakh / Aana');

    const empty = formatPricePerUnit(0, 0, 'AANA', 'en');
    expect(empty).toBe('');
  });
});
