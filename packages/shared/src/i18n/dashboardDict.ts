export interface DashboardDictionary {
  myListings: string;
  shortlist: string;
  creditsWallet: string;
  profileUnits: string;
  postNewListing: string;
  noListingsTitle: string;
  noListingsSubtitle: string;
  noShortlistTitle: string;
  noShortlistSubtitle: string;
  availableCredits: string;
  launchPromoBadge: string;
  validityNotice: string;
  unlockHistory: string;
  noUnlocksYet: string;
  editProfile: string;
  saveChanges: string;
  fullName: string;
  primaryDistrict: string;
  measurementSystem: string;
}

export const dashboardDictEn: DashboardDictionary = {
  myListings: 'My Listings',
  shortlist: 'Shortlist',
  creditsWallet: 'Credits Wallet',
  profileUnits: 'Profile & Land Units',
  postNewListing: 'Post New Property',
  noListingsTitle: 'You have not posted any properties yet',
  noListingsSubtitle: 'List your land or house directly with 0% brokerage fee and reach verified buyers across Nepal.',
  noShortlistTitle: 'Your Shortlist is Empty',
  noShortlistSubtitle: 'Click the heart icon on any listing in search to save properties for quick comparison.',
  availableCredits: 'Available Contact Credits',
  launchPromoBadge: 'Launch Seeding Grant',
  validityNotice: 'Complimentary credits are valid for 90 days from registration.',
  unlockHistory: 'Contact Unlock History',
  noUnlocksYet: 'No landowner contacts unlocked yet.',
  editProfile: 'Investor / Landowner Profile',
  saveChanges: 'Save Profile Changes',
  fullName: 'Full Legal Name',
  primaryDistrict: 'Primary District of Focus',
  measurementSystem: 'Preferred Regional Measurement System',
};

export const dashboardDictNe: DashboardDictionary = {
  myListings: 'मेरा सम्पत्तिहरू',
  shortlist: 'सुरक्षित सम्पत्तिहरू',
  creditsWallet: 'क्रेडिट वालेट',
  profileUnits: 'प्रोफाइल तथा नापी',
  postNewListing: 'नयाँ सम्पत्ति राख्नुहोस्',
  noListingsTitle: 'तपाईंले अहिलेसम्म कुनै सम्पत्ति राख्नुभएको छैन',
  noListingsSubtitle: 'शून्य दलालीमा सिधै आफ्नो जग्गा वा घरको विज्ञापन गर्नुहोस् र वास्तविक खरिदकर्ताहरूसँग सम्पर्क गर्नुहोस्।',
  noShortlistTitle: 'तपाईंको सूची खाली छ',
  noShortlistSubtitle: 'सम्पत्ति खोज्दा मन परेको सम्पत्ति सुरक्षित गर्न मुटु आइकनमा क्लिक गर्नुहोस्।',
  availableCredits: 'उपलब्ध सम्पर्क क्रेडिट',
  launchPromoBadge: 'प्रारम्भिक उपहार क्रेडिट',
  validityNotice: 'निःशुल्क क्रेडिट दर्ता भएको ९० दिनसम्म मान्य रहन्छ।',
  unlockHistory: 'सम्पर्क अनलक इतिहास',
  noUnlocksYet: 'अहिलेसम्म कुनै जग्गाधनी सम्पर्क अनलक गरिएको छैन।',
  editProfile: 'लगानीकर्ता / जग्गाधनी प्रोफाइल',
  saveChanges: 'प्रोफाइल सुरक्षित गर्नुहोस्',
  fullName: 'पूरा कानुनी नाम',
  primaryDistrict: 'मुख्य जिल्ला',
  measurementSystem: 'प्राथमिक क्षेत्रीय नाप प्रणाली',
};

export function getDashboardDict(lang: 'en' | 'ne' = 'en'): DashboardDictionary {
  return lang === 'ne' ? dashboardDictNe : dashboardDictEn;
}

