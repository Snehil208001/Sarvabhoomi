import { PreferredRegion } from '../validators/auth';

/**
 * Nepal District to Measurement Region Mapping.
 * - 'HILLY': Uses Ropani-Aana-Paisa-Daam (Kathmandu Valley, Pokhara/Kaski, and all Hill/Mountain districts).
 * - 'TERAI': Uses Bigha-Kattha-Dhur (Terai plains and Inner Terai valleys).
 */
export const DISTRICT_REGION_MAP: Record<string, PreferredRegion> = {
  // Kathmandu Valley & Bagmati Hills
  'Kathmandu': 'HILLY',
  'Lalitpur': 'HILLY',
  'Bhaktapur': 'HILLY',
  'Kavrepalanchok': 'HILLY',
  'Kaski': 'HILLY',
  'Dhading': 'HILLY',
  'Nuwakot': 'HILLY',
  'Rasuwa': 'HILLY',
  'Sindhupalchok': 'HILLY',
  'Dolakha': 'HILLY',
  'Ramechhap': 'HILLY',
  'Sindhuli': 'HILLY',
  'Makwanpur': 'HILLY',

  // Eastern Hills & Mountain
  'Taplejung': 'HILLY',
  'Panchthar': 'HILLY',
  'Ilam': 'HILLY',
  'Sankhuwasabha': 'HILLY',
  'Tehrathum': 'HILLY',
  'Bhojpur': 'HILLY',
  'Dhankuta': 'HILLY',
  'Solukhumbu': 'HILLY',
  'Khotang': 'HILLY',
  'Okhaldhunga': 'HILLY',
  'Udayapur': 'HILLY',

  // Gandaki Hills & Mountain
  'Gorkha': 'HILLY',
  'Manang': 'HILLY',
  'Mustang': 'HILLY',
  'Myagdi': 'HILLY',
  'Parbat': 'HILLY',
  'Baglung': 'HILLY',
  'Lamjung': 'HILLY',
  'Tanahun': 'HILLY',
  'Syangja': 'HILLY',

  // Lumbini Hills
  'Palpa': 'HILLY',
  'Gulmi': 'HILLY',
  'Arghakhanchi': 'HILLY',
  'Pyuthan': 'HILLY',
  'Rolpa': 'HILLY',
  'Eastern Rukum': 'HILLY',

  // Karnali & Sudurpashchim Hills & Mountains
  'Western Rukum': 'HILLY',
  'Salyan': 'HILLY',
  'Dolpa': 'HILLY',
  'Jumla': 'HILLY',
  'Kalikot': 'HILLY',
  'Mugu': 'HILLY',
  'Humla': 'HILLY',
  'Jajarkot': 'HILLY',
  'Dailekh': 'HILLY',
  'Surkhet': 'HILLY',
  'Bajura': 'HILLY',
  'Bajhang': 'HILLY',
  'Achham': 'HILLY',
  'Doti': 'HILLY',
  'Darchula': 'HILLY',
  'Baitadi': 'HILLY',
  'Dadeldhura': 'HILLY',

  // Terai & Inner Terai Districts (Bigha-Kattha-Dhur System)
  'Jhapa': 'TERAI',
  'Morang': 'TERAI',
  'Sunsari': 'TERAI',
  'Saptari': 'TERAI',
  'Siraha': 'TERAI',
  'Dhanusha': 'TERAI',
  'Mahottari': 'TERAI',
  'Sarlahi': 'TERAI',
  'Rautahat': 'TERAI',
  'Bara': 'TERAI',
  'Parsa': 'TERAI',
  'Chitwan': 'TERAI',
  'Nawalpur': 'TERAI',
  'Parasi': 'TERAI',
  'Rupandehi': 'TERAI',
  'Kapilvastu': 'TERAI',
  'Dang': 'TERAI',
  'Banke': 'TERAI',
  'Bardiya': 'TERAI',
  'Kailali': 'TERAI',
  'Kanchanpur': 'TERAI',
};

export const HILLY_DISTRICTS = Object.entries(DISTRICT_REGION_MAP)
  .filter(([_, region]) => region === 'HILLY')
  .map(([district]) => district);

export const TERAI_DISTRICTS = Object.entries(DISTRICT_REGION_MAP)
  .filter(([_, region]) => region === 'TERAI')
  .map(([district]) => district);

export const ALL_DISTRICTS = Object.keys(DISTRICT_REGION_MAP).sort();

export interface DistrictInfo {
  nameEn: string;
  nameNe: string;
  region: PreferredRegion;
}

export const ALL_NEPAL_DISTRICTS: DistrictInfo[] = ALL_DISTRICTS.map((d) => ({
  nameEn: d,
  nameNe: d,
  region: DISTRICT_REGION_MAP[d],
}));

/**
 * Returns the default land measurement region for a given Nepal district.
 * Defaults to 'HILLY' if not found.
 */
export function getRegionForDistrict(district: string): PreferredRegion {
  return DISTRICT_REGION_MAP[district] || 'HILLY';
}

export const LAND_MEASUREMENT_SYSTEM_INFO = {
  HILLY: {
    systemKey: 'HILLY',
    systemName: 'Ropani-Aana-Paisa-Daam',
    systemNameNe: 'रोपनी - आना - पैसा - दाम',
    units: ['Ropani', 'Aana', 'Paisa', 'Daam'],
    unitsNe: ['रोपनी', 'आना', 'पैसा', 'दाम'],
    description: 'Standard land measurement across Kathmandu Valley, Pokhara, and Hill/Mountain districts.',
  },
  TERAI: {
    systemKey: 'TERAI',
    systemName: 'Bigha-Kattha-Dhur',
    systemNameNe: 'बिघा - कट्ठा - धुर',
    units: ['Bigha', 'Kattha', 'Dhur'],
    unitsNe: ['बिघा', 'कट्ठा', 'धुर'],
    description: 'Standard land measurement across Terai plains and Inner Terai valleys.',
  },
} as const;
