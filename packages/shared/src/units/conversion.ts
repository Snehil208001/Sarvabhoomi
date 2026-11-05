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
