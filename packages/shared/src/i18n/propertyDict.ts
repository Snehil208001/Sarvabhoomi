export interface PropertyDictionary {
  lalpurjaVerified: string;
  lalpurjaClaimedPending: string;
  zeroBrokerage: string;
  contactOwner: string;
  contactUnlocked: string;
  viewDetails: string;
  roadAccess: string;
  facing: string;
  bedrooms: string;
  bathrooms: string;
  kittaNo: string;
  cadastralSurvey: string;
  shareListing: string;
  saveShortlist: string;
  savedShortlist: string;
  linkCopied: string;
  similarProperties: string;
  directOwnerSale: string;
  creditsRequiredNotice: string;
}

export const propertyDictEn: PropertyDictionary = {
  lalpurjaVerified: 'Lalpurja Verified Ownership',
  lalpurjaClaimedPending: 'Lalpurja claimed by owner — pending verification',
  zeroBrokerage: '0% Brokerage Direct P2P',
  contactOwner: 'Contact Owner',
  contactUnlocked: 'Contact Info Unlocked',
  viewDetails: 'View Details',
  roadAccess: 'Road Access',
  facing: 'Facing',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  kittaNo: 'Cadastral Kitta No',
  cadastralSurvey: 'Official Survey Cadastral Grid',
  shareListing: 'Share',
  saveShortlist: 'Save',
  savedShortlist: 'Saved',
  linkCopied: 'Link Copied!',
  similarProperties: 'Similar Direct Owner Listings',
  directOwnerSale: 'Direct Owner Listing — Zero Broker Commission',
  creditsRequiredNotice: 'Uses 1 complimentary contact-unlock credit',
};

export const propertyDictNe: PropertyDictionary = {
  lalpurjaVerified: 'प्रमाणित लालपुर्जा स्वामित्व',
  lalpurjaClaimedPending: 'जग्गाधनीद्वारा दाबी गरिएको लालपुर्जा — प्रमाणीकरण प्रक्रियामा',
  zeroBrokerage: '०% दलाली प्रत्यक्ष खरिदबिक्री',
  contactOwner: 'जग्गाधनी सम्पर्क',
  contactUnlocked: 'सम्पर्क विवरण खुल्यो',
  viewDetails: 'विवरण हेर्नुहोस्',
  roadAccess: 'बाटोको पहुँच',
  facing: 'मोहोडा',
  bedrooms: 'कोठाहरू',
  bathrooms: 'शौचालय',
  kittaNo: 'कित्ता नम्बर',
  cadastralSurvey: 'सरकारी नापी कित्ता नक्सा',
  shareListing: 'सेयर गर्नुहोस्',
  saveShortlist: 'सुरक्षित गर्नुहोस्',
  savedShortlist: 'सुरक्षित गरियो',
  linkCopied: 'लिङ्क कपी भयो!',
  similarProperties: 'उस्तै प्रत्यक्ष जग्गाधनीका सम्पत्तिहरू',
  directOwnerSale: 'प्रत्यक्ष जग्गाधनी बिक्री — शून्य दलाल कमिसन',
  creditsRequiredNotice: '१ निःशुल्क सम्पर्क-अनलक क्रेडिट प्रयोग हुन्छ',
};

export function getPropertyDict(lang: 'en' | 'ne' = 'en'): PropertyDictionary {
  return lang === 'ne' ? propertyDictNe : propertyDictEn;
}
