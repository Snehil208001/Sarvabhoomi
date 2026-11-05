export interface SearchDictionary {
  allProperties: string;
  buyLand: string;
  buyHouse: string;
  rentHouse: string;
  commercial: string;
  searchPlaceholder: string;
  allDistricts: string;
  selectDistrict: string;
  lalpurjaVerifiedOnly: string;
  pricePresetAll: string;
  priceUnder1Cr: string;
  price1CrTo3Cr: string;
  priceAbove3Cr: string;
  sortBy: string;
  sortNewest: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortAreaDesc: string;
  filters: string;
  resetFilters: string;
  noResultsTitle: string;
  noResultsSubtitle: string;
  viewAll: string;
  showingResults: (from: number, to: number, total: number) => string;
  previous: string;
  next: string;
}

export const searchDictEn: SearchDictionary = {
  allProperties: 'All Properties',
  buyLand: 'Buy Land (Ghaderi)',
  buyHouse: 'Buy House / Villa',
  rentHouse: 'Rentals',
  commercial: 'Commercial',
  searchPlaceholder: 'Search by locality, municipality, landmark...',
  allDistricts: 'All 77 Districts',
  selectDistrict: 'Select District',
  lalpurjaVerifiedOnly: 'Lalpurja Verified Only',
  pricePresetAll: 'Any Price',
  priceUnder1Cr: 'Under 1 Crore',
  price1CrTo3Cr: '1 - 3 Crore',
  priceAbove3Cr: 'Above 3 Crore',
  sortBy: 'Sort By',
  sortNewest: 'Newest First',
  sortPriceAsc: 'Price: Low to High',
  sortPriceDesc: 'Price: High to Low',
  sortAreaDesc: 'Area: Largest First',
  filters: 'Filters',
  resetFilters: 'Reset Filters',
  noResultsTitle: 'No Properties Match Your Search',
  noResultsSubtitle: 'Try broadening your filters, choosing a different district, or resetting the search criteria.',
  viewAll: 'View All Properties',
  showingResults: (from, to, total) => `Showing ${from} - ${to} of ${total} properties`,
  previous: 'Previous',
  next: 'Next',
};

export const searchDictNe: SearchDictionary = {
  allProperties: 'सबै सम्पत्ति',
  buyLand: 'जग्गा / घडेरी',
  buyHouse: 'घर / भिल्ला',
  rentHouse: 'भाडामा',
  commercial: 'व्यावसायिक',
  searchPlaceholder: 'स्थान, टोल, नगरपालिका वा चिनारी खोज्नुहोस्...',
  allDistricts: 'सबै ७७ जिल्ला',
  selectDistrict: 'जिल्ला छान्नुहोस्',
  lalpurjaVerifiedOnly: 'प्रमाणित लालपुर्जा मात्र',
  pricePresetAll: 'सबै मूल्य',
  priceUnder1Cr: '१ करोड भन्दा कम',
  price1CrTo3Cr: '१ करोड - ३ करोड',
  priceAbove3Cr: '३ करोड भन्दा माथि',
  sortBy: 'क्रमबद्ध',
  sortNewest: 'नयाँ पहिलो',
  sortPriceAsc: 'मूल्य: सस्तोबाट महँगो',
  sortPriceDesc: 'मूल्य: महँगोबाट सस्तो',
  sortAreaDesc: 'क्षेत्रफल: ठूलोबाट सानो',
  filters: 'फिल्टरहरू',
  resetFilters: 'फिल्टर रिसेट',
  noResultsTitle: 'कुनै सम्पत्ति फेला परेन',
  noResultsSubtitle: 'कृपया फरक जिल्ला छनोट गर्नुहोस् वा फिल्टर रिसेट गर्नुहोस्।',
  viewAll: 'सबै सम्पत्ति हेर्नुहोस्',
  showingResults: (from, to, total) => `जम्मा ${total} मध्ये ${from} - ${to} सम्पत्तिहरू`,
  previous: 'अघिल्लो',
  next: 'पछिल्लो',
};

export function getSearchDict(lang: 'en' | 'ne' = 'en'): SearchDictionary {
  return lang === 'ne' ? searchDictNe : searchDictEn;
}
