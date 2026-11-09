import { AreaUnit } from '../validators/property';

/**
 * Standard Nepal Land Measurement Constants in Square Feet
 */
export const SQFT_PER_UNIT: Record<AreaUnit, number> = {
  ROPANI: 5476,
  AANA: 342.25,
  BIGHA: 72900,
  KATTHA: 3645,
  SQFT: 1,
};

/**
 * Converts any Nepal land area to Square Feet
 */
export function toSqFt(value: number, unit: AreaUnit): number {
  if (!value || isNaN(value)) return 0;
  const factor = SQFT_PER_UNIT[unit] || 1;
  return Math.round(value * factor * 100) / 100;
}

/**
 * Converts Square Feet into a target unit
 */
export function fromSqFt(sqft: number, targetUnit: AreaUnit): number {
  if (!sqft || isNaN(sqft)) return 0;
  const factor = SQFT_PER_UNIT[targetUnit] || 1;
  return Math.round((sqft / factor) * 100) / 100;
}

/**
 * Formats area value and unit with optional square feet subtitle
 */
export function formatArea(
  value: number,
  unit: AreaUnit,
  lang: 'en' | 'ne' = 'en',
  options: { includeSqft?: boolean } = { includeSqft: true }
): string {
  const unitLabelsEn: Record<AreaUnit, string> = {
    ROPANI: 'Ropani',
    AANA: 'Aana',
    BIGHA: 'Bigha',
    KATTHA: 'Kattha',
    SQFT: 'sq. ft.',
  };

  const unitLabelsNe: Record<AreaUnit, string> = {
    ROPANI: 'रोपनी',
    AANA: 'आना',
    BIGHA: 'बिघा',
    KATTHA: 'कट्ठा',
    SQFT: 'वर्ग फिट',
  };

  const unitLabel = lang === 'en' ? unitLabelsEn[unit] : unitLabelsNe[unit];
  const formattedVal = Number(value.toFixed(2)).toString();

  if (unit === 'SQFT' || !options.includeSqft) {
    return `${formattedVal} ${unitLabel}`;
  }

  const sqft = toSqFt(value, unit);
  const sqftStr = sqft.toLocaleString('en-US');
  const sqftUnit = lang === 'en' ? 'sq ft' : 'वर्ग फिट';

  return `${formattedVal} ${unitLabel} (${sqftStr} ${sqftUnit})`;
}

/**
 * Formats NPR price in South Asian / Nepal notation:
 * - >= 10,000,000 (1 Crore): e.g. "Rs. 2.50 Cr" / "रु २.५० करोड"
 * - >= 100,000 (1 Lakh): e.g. "Rs. 85 Lakh" / "रु ८५ लाख"
 * - < 100,000: e.g. "Rs. 75,000" / "रु ७५,०००"
 */
export function formatPriceNPR(price: number, lang: 'en' | 'ne' = 'en'): string {
  if (price === undefined || price === null || isNaN(price)) return 'N/A';

  const prefix = lang === 'en' ? 'Rs. ' : 'रु ';

  if (price >= 10000000) {
    const crores = price / 10000000;
    const formatted = crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2);
    const label = lang === 'en' ? 'Cr' : 'करोड';
    return `${prefix}${formatted} ${label}`;
  }

  if (price >= 100000) {
    const lakhs = price / 100000;
    const formatted = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(2);
    const label = lang === 'en' ? 'Lakh' : 'लाख';
    return `${prefix}${formatted} ${label}`;
  }

  return `${prefix}${price.toLocaleString('en-IN')}`;
}

/**
 * Calculates and formats price per unit (e.g., "Rs. 35 Lakh / Aana")
 */
export function formatPricePerUnit(
  totalPrice: number,
  areaValue: number,
  unit: AreaUnit,
  lang: 'en' | 'ne' = 'en'
): string {
  if (!totalPrice || !areaValue || areaValue <= 0) return '';
  const pricePerUnit = totalPrice / areaValue;
  const unitLabelsEn: Record<AreaUnit, string> = {
    ROPANI: 'Ropani',
    AANA: 'Aana',
    BIGHA: 'Bigha',
    KATTHA: 'Kattha',
    SQFT: 'sq.ft.',
  };
  const unitLabelsNe: Record<AreaUnit, string> = {
    ROPANI: 'रोपनी',
    AANA: 'आना',
    BIGHA: 'बिघा',
    KATTHA: 'कट्ठा',
    SQFT: 'वर्ग फिट',
  };

  const formattedRate = formatPriceNPR(pricePerUnit, lang);
  const unitName = lang === 'en' ? unitLabelsEn[unit] : unitLabelsNe[unit];

  return `${formattedRate} / ${unitName}`;
}

/**
 * Formats Monthly Rent in NPR with prominent "/month" or "/महिना" label
 * e.g., "Rs. 25,000/month" or "रु २५,०००/महिना"
 */
export function formatMonthlyRentNPR(rent: number | null | undefined, lang: 'en' | 'ne' = 'en'): string {
  if (rent === undefined || rent === null || isNaN(rent) || rent <= 0) {
    return lang === 'en' ? 'Rent on request' : 'भाडा सोधपुछमा';
  }
  const prefix = lang === 'en' ? 'Rs. ' : 'रु ';
  const suffix = lang === 'en' ? '/month' : '/महिना';
  return `${prefix}${rent.toLocaleString('en-IN')}${suffix}`;
}

/**
 * Formats Deposit amount in NPR, or "Not specified" if null
 */
export function formatDeposit(deposit: number | null | undefined, lang: 'en' | 'ne' = 'en'): string {
  if (deposit === undefined || deposit === null || isNaN(deposit)) {
    return lang === 'en' ? 'Not specified' : 'उल्लेख नभएको';
  }
  if (deposit === 0) {
    return lang === 'en' ? 'No Deposit' : 'धरौटी नपर्ने';
  }
  const prefix = lang === 'en' ? 'Rs. ' : 'रु ';
  return `${prefix}${deposit.toLocaleString('en-IN')}`;
}

/**
 * Formats Furnishing status into clean human-readable label
 * Always one word for state, no duplication (e.g. 'Semi-Furnished', not 'Semi_furnished Furnished')
 */
export function formatFurnishing(furnishing: string | null | undefined, lang: 'en' | 'ne' = 'en'): string {
  if (!furnishing) {
    return lang === 'en' ? 'Unspecified' : 'उल्लेख नभएको';
  }
  const normalized = furnishing.trim().toUpperCase();
  if (normalized.startsWith('FULL')) {
    return lang === 'en' ? 'Fully-Furnished' : 'पूर्ण फर्निसिङ';
  }
  if (normalized.startsWith('SEMI')) {
    return lang === 'en' ? 'Semi-Furnished' : 'आंशिक फर्निसिङ';
  }
  if (normalized.startsWith('UN')) {
    return lang === 'en' ? 'Unfurnished' : 'फर्निसिङ नभएको';
  }
  return lang === 'en' ? 'Unfurnished' : 'फर्निसिङ नभएको';
}

/**
 * Formats Views Count with correct singular/plural and space
 * e.g. "1 view" / "2 views" or "१ पटक हेरिएको" / "२ पटक हेरिएको"
 */
export function formatViewsCount(count: number | null | undefined, lang: 'en' | 'ne' = 'en'): string {
  const views = typeof count === 'number' && !isNaN(count) && count >= 0 ? count : 1;
  if (lang === 'ne') {
    return `${views} पटक हेरिएको`;
  }
  return views === 1 ? '1 view' : `${views.toLocaleString('en-IN')} views`;
}

/**
 * Kathmandu Valley System: Ropani-Aana-Paisa-Daam (RAPD) Constants & Math
 * 1 Ropani = 16 Aana = 5,476 sq ft
 * 1 Aana = 4 Paisa = 342.25 sq ft
 * 1 Paisa = 4 Daam = 85.5625 sq ft
 * 1 Daam = 21.390625 sq ft
 */
export function rapdToSqFt(ropani: number, aana: number, paisa: number = 0, daam: number = 0): number {
  const r = Math.max(0, Number(ropani) || 0);
  const a = Math.max(0, Number(aana) || 0);
  const p = Math.max(0, Number(paisa) || 0);
  const d = Math.max(0, Number(daam) || 0);
  const sqft = (r * 5476) + (a * 342.25) + (p * 85.5625) + (d * 21.390625);
  return Math.round(sqft * 100) / 100;
}

export function sqFtToRAPD(sqft: number): {
  ropani: number;
  aana: number;
  paisa: number;
  daam: number;
  formatted: string;
} {
  if (!sqft || sqft <= 0 || isNaN(sqft)) {
    return { ropani: 0, aana: 0, paisa: 0, daam: 0, formatted: '0-0-0-0' };
  }
  let remaining = sqft;
  const ropani = Math.floor(remaining / 5476);
  remaining %= 5476;

  const aana = Math.floor(remaining / 342.25);
  remaining %= 342.25;

  const paisa = Math.floor(remaining / 85.5625);
  remaining %= 85.5625;

  const daam = Math.round((remaining / 21.390625) * 10) / 10;

  return {
    ropani,
    aana,
    paisa,
    daam,
    formatted: `${ropani}-${aana}-${paisa}-${daam}`,
  };
}

/**
 * Terai Plains System: Bigha-Katha-Dhur (BKD) Constants & Math
 * 1 Bigha = 20 Katha = 72,900 sq ft
 * 1 Katha = 20 Dhur = 3,645 sq ft
 * 1 Dhur = 182.25 sq ft
 */
export function bkdToSqFt(bigha: number, katha: number, dhur: number = 0): number {
  const b = Math.max(0, Number(bigha) || 0);
  const k = Math.max(0, Number(katha) || 0);
  const d = Math.max(0, Number(dhur) || 0);
  const sqft = (b * 72900) + (k * 3645) + (d * 182.25);
  return Math.round(sqft * 100) / 100;
}

export function sqFtToBKD(sqft: number): {
  bigha: number;
  katha: number;
  dhur: number;
  formatted: string;
} {
  if (!sqft || sqft <= 0 || isNaN(sqft)) {
    return { bigha: 0, katha: 0, dhur: 0, formatted: '0-0-0' };
  }
  let remaining = sqft;
  const bigha = Math.floor(remaining / 72900);
  remaining %= 72900;

  const katha = Math.floor(remaining / 3645);
  remaining %= 3645;

  const dhur = Math.round((remaining / 182.25) * 10) / 10;

  return {
    bigha,
    katha,
    dhur,
    formatted: `${bigha}-${katha}-${dhur}`,
  };
}

/**
 * Metric <-> Imperial Land Equivalents
 * 1 sq ft = 0.092903 sq meter
 */
export function sqFtToSqMeters(sqft: number): number {
  if (!sqft || sqft <= 0 || isNaN(sqft)) return 0;
  return Math.round(sqft * 0.092903 * 100) / 100;
}

export function sqMetersToSqFt(sqm: number): number {
  if (!sqm || sqm <= 0 || isNaN(sqm)) return 0;
  return Math.round((sqm / 0.092903) * 100) / 100;
}




