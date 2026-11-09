import { describe, it, expect } from 'vitest';
import {
  toSqFt,
  fromSqFt,
  formatArea,
  formatPriceNPR,
  formatPricePerUnit,
  formatFurnishing,
  formatViewsCount,
  SQFT_PER_UNIT,
  rapdToSqFt,
  sqFtToRAPD,
  bkdToSqFt,
  sqFtToBKD,
  sqFtToSqMeters,
  sqMetersToSqFt,
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

describe('Rental Furnishing & Views Formatting', () => {
  it('formats furnishing status cleanly without duplication', () => {
    expect(formatFurnishing('SEMI')).toBe('Semi-Furnished');
    expect(formatFurnishing('SEMI_FURNISHED')).toBe('Semi-Furnished');
    expect(formatFurnishing('FULLY')).toBe('Fully-Furnished');
    expect(formatFurnishing('FULLY_FURNISHED')).toBe('Fully-Furnished');
    expect(formatFurnishing('UNFURNISHED')).toBe('Unfurnished');
    expect(formatFurnishing(null)).toBe('Unspecified');

    // Nepali translations
    expect(formatFurnishing('SEMI', 'ne')).toBe('आंशिक फर्निसिङ');
    expect(formatFurnishing('FULLY', 'ne')).toBe('पूर्ण फर्निसिङ');
    expect(formatFurnishing('UNFURNISHED', 'ne')).toBe('फर्निसिङ नभएको');
  });

  it('formats views count with correct singular/plural and spacing', () => {
    expect(formatViewsCount(1, 'en')).toBe('1 view');
    expect(formatViewsCount(2, 'en')).toBe('2 views');
    expect(formatViewsCount(42, 'en')).toBe('42 views');
    expect(formatViewsCount(0, 'en')).toBe('0 views');
    expect(formatViewsCount(undefined, 'en')).toBe('1 view');

    // Nepali translations
    expect(formatViewsCount(1, 'ne')).toBe('1 पटक हेरिएको');
    expect(formatViewsCount(5, 'ne')).toBe('5 पटक हेरिएको');
  });
});

describe('Valley (RAPD) and Terai (BKD) Composite Calculations', () => {
  it('converts Ropani-Aana-Paisa-Daam to Sq. Ft. correctly', () => {
    // 1-0-0-0 = 5476
    expect(rapdToSqFt(1, 0, 0, 0)).toBe(5476);
    // 0-4-0-0 = 1369
    expect(rapdToSqFt(0, 4, 0, 0)).toBe(1369);
    // 1-2-1-1 = 5476 + 684.5 + 85.5625 + 21.390625 = 6267.45
    expect(rapdToSqFt(1, 2, 1, 1)).toBeCloseTo(6267.45, 1);
  });

  it('converts Sq. Ft. to Ropani-Aana-Paisa-Daam breakdown correctly', () => {
    const res = sqFtToRAPD(5476);
    expect(res.ropani).toBe(1);
    expect(res.aana).toBe(0);
    expect(res.paisa).toBe(0);
    expect(res.daam).toBe(0);
    expect(res.formatted).toBe('1-0-0-0');

    const res2 = sqFtToRAPD(1369);
    expect(res2.ropani).toBe(0);
    expect(res2.aana).toBe(4);
    expect(res2.formatted).toBe('0-4-0-0');
  });

  it('converts Bigha-Katha-Dhur to Sq. Ft. correctly', () => {
    // 1-0-0 = 72900
    expect(bkdToSqFt(1, 0, 0)).toBe(72900);
    // 0-1-0 = 3645
    expect(bkdToSqFt(0, 1, 0)).toBe(3645);
    // 0-0-1 = 182.25
    expect(bkdToSqFt(0, 0, 1)).toBe(182.25);
    // 1-2-10 = 72900 + 7290 + 1822.5 = 82012.5
    expect(bkdToSqFt(1, 2, 10)).toBe(82012.5);
  });

  it('converts Sq. Ft. to Bigha-Katha-Dhur breakdown correctly', () => {
    const res = sqFtToBKD(72900);
    expect(res.bigha).toBe(1);
    expect(res.katha).toBe(0);
    expect(res.dhur).toBe(0);
    expect(res.formatted).toBe('1-0-0');

    const res2 = sqFtToBKD(3645);
    expect(res2.bigha).toBe(0);
    expect(res2.katha).toBe(1);
    expect(res2.dhur).toBe(0);
    expect(res2.formatted).toBe('0-1-0');
  });

  it('converts between Sq. Ft. and Sq. Meters accurately', () => {
    expect(sqFtToSqMeters(1000)).toBe(92.9);
    expect(sqMetersToSqFt(92.9)).toBeCloseTo(1000, 0);
  });
});

