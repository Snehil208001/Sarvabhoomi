import { describe, it, expect } from 'vitest';
import {
  calculatePropertyValuation,
  DISTRICT_INDICATIVE_RATES,
  DEFAULT_BASELINE_RATE,
} from '../units/valuationRates';
import {
  getRegionForDistrict,
  ALL_NEPAL_DISTRICTS,
  DISTRICT_REGION_MAP,
} from '../units/districtMap';

describe('Property Valuation Engine', () => {
  it('calculates government and market valuations for Kathmandu', () => {
    // 4 Aana in Kathmandu
    const val = calculatePropertyValuation('Kathmandu', 4, 'AANA');
    const rate = DISTRICT_INDICATIVE_RATES.Kathmandu;

    expect(val.governmentMinTotal).toBe(4 * rate.governmentMinRatePerAana);
    expect(val.marketEstimatedTotal).toBe(4 * rate.marketAvgRatePerAana);
    expect(val.marketRangeLow).toBeLessThan(val.marketEstimatedTotal);
    expect(val.marketRangeHigh).toBeGreaterThan(val.marketEstimatedTotal);
    expect(val.brokerageSavedAt3Pct).toBe(Math.round(val.marketEstimatedTotal * 0.03));
  });

  it('calculates Terai properties converting Kattha to standard valuation', () => {
    // 1 Kattha in Chitwan
    const val = calculatePropertyValuation('Chitwan', 1, 'KATTHA');
    expect(val.governmentMinTotal).toBeGreaterThan(0);
    expect(val.marketEstimatedTotal).toBeGreaterThan(0);
    expect(val.brokerageSavedAt3Pct).toBe(Math.round(val.marketEstimatedTotal * 0.03));
  });

  it('falls back to default baseline rate for non-explicit districts', () => {
    const val = calculatePropertyValuation('Manang', 1, 'ROPANI');
    // 1 Ropani = 16 Aana
    expect(val.governmentMinTotal).toBe(16 * DEFAULT_BASELINE_RATE.governmentMinRatePerAana);
    expect(val.marketEstimatedTotal).toBe(16 * DEFAULT_BASELINE_RATE.marketAvgRatePerAana);
  });
});

describe('Nepal 77 District & Region Mapping', () => {
  it('contains all 77 districts of Nepal', () => {
    expect(ALL_NEPAL_DISTRICTS.length).toBe(77);
  });

  it('correctly maps Hilly districts', () => {
    expect(getRegionForDistrict('Kathmandu')).toBe('HILLY');
    expect(getRegionForDistrict('Lalitpur')).toBe('HILLY');
    expect(getRegionForDistrict('Bhaktapur')).toBe('HILLY');
    expect(getRegionForDistrict('Kaski')).toBe('HILLY');
  });

  it('correctly maps Terai districts', () => {
    expect(getRegionForDistrict('Chitwan')).toBe('TERAI');
    expect(getRegionForDistrict('Jhapa')).toBe('TERAI');
    expect(getRegionForDistrict('Morang')).toBe('TERAI');
    expect(getRegionForDistrict('Rupandehi')).toBe('TERAI');
  });

  it('defaults unknown districts safely to HILLY', () => {
    expect(getRegionForDistrict('UnknownPlace' as any)).toBe('HILLY');
  });
});
