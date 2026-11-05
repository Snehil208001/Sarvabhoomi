import { AreaUnit } from '../validators/property';
import { toSqFt, fromSqFt } from './conversion';

export interface DistrictValuationRate {
  governmentMinRatePerAana: number; // in NPR
  marketAvgRatePerAana: number;     // in NPR
  governmentMinRatePerKattha: number;
  marketAvgRatePerKattha: number;
}

// Indicative rates per Aana (Hilly) or per Kattha (Terai) for key representative districts
export const DISTRICT_INDICATIVE_RATES: Record<string, DistrictValuationRate> = {
  Kathmandu: {
    governmentMinRatePerAana: 1200000,
    marketAvgRatePerAana: 3500000,
    governmentMinRatePerKattha: 12800000,
    marketAvgRatePerKattha: 37000000,
  },
  Lalitpur: {
    governmentMinRatePerAana: 900000,
    marketAvgRatePerAana: 2800000,
    governmentMinRatePerKattha: 9600000,
    marketAvgRatePerKattha: 30000000,
  },
  Bhaktapur: {
    governmentMinRatePerAana: 600000,
    marketAvgRatePerAana: 2000000,
    governmentMinRatePerKattha: 6400000,
    marketAvgRatePerKattha: 21000000,
  },
  Kaski: {
    governmentMinRatePerAana: 500000,
    marketAvgRatePerAana: 1800000,
    governmentMinRatePerKattha: 5300000,
    marketAvgRatePerKattha: 19000000,
  },
  Chitwan: {
    governmentMinRatePerAana: 300000,
    marketAvgRatePerAana: 1200000,
    governmentMinRatePerKattha: 3200000,
    marketAvgRatePerKattha: 12800000,
  },
  Rupandehi: {
    governmentMinRatePerAana: 280000,
    marketAvgRatePerAana: 1100000,
    governmentMinRatePerKattha: 3000000,
    marketAvgRatePerKattha: 11800000,
  },
  Morang: {
    governmentMinRatePerAana: 250000,
    marketAvgRatePerAana: 950000,
    governmentMinRatePerKattha: 2600000,
    marketAvgRatePerKattha: 10200000,
  },
};

// Default baseline rates for other districts
export const DEFAULT_BASELINE_RATE: DistrictValuationRate = {
  governmentMinRatePerAana: 200000,
  marketAvgRatePerAana: 800000,
  governmentMinRatePerKattha: 2100000,
  marketAvgRatePerKattha: 8500000,
};

export interface PropertyValuationResult {
  governmentMinTotal: number;
  marketEstimatedTotal: number;
  marketRangeLow: number;
  marketRangeHigh: number;
  registrationTaxEstimate: number; // typically 4.5% in urban, 2% in rural
  brokerageSavedAt3Pct: number;    // 3% standard broker fee saved
}

export function calculatePropertyValuation(
  district: string,
  areaValue: number,
  areaUnit: AreaUnit
): PropertyValuationResult {
  const rateConfig = DISTRICT_INDICATIVE_RATES[district] || DEFAULT_BASELINE_RATE;
  const sqft = toSqFt(areaValue, areaUnit);

  // Convert to Aanas
  const aanas = fromSqFt(sqft, 'AANA');

  const governmentMinTotal = Math.round(aanas * rateConfig.governmentMinRatePerAana);
  const marketEstimatedTotal = Math.round(aanas * rateConfig.marketAvgRatePerAana);

  const marketRangeLow = Math.round(marketEstimatedTotal * 0.88);
  const marketRangeHigh = Math.round(marketEstimatedTotal * 1.15);

  // Registration fee (~4.5% of government valuation for municipalities)
  const registrationTaxEstimate = Math.round(governmentMinTotal * 0.045);

  // 3% standard broker fee saved with Sarvabhoomi
  const brokerageSavedAt3Pct = Math.round(marketEstimatedTotal * 0.03);

  return {
    governmentMinTotal,
    marketEstimatedTotal,
    marketRangeLow,
    marketRangeHigh,
    registrationTaxEstimate,
    brokerageSavedAt3Pct,
  };
}
