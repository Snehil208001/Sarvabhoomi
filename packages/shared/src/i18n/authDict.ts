export interface AuthDictionary {
  brand: {
    name: string;
    tagline: string;
    subTagline: string;
  };
  phoneAuth: {
    title: string;
    subtitle: string;
    phoneLabel: string;
    phonePlaceholder: string;
    countryCodeLabel: string;
    sendOtpButton: string;
    sendingOtp: string;
    phoneHint: string;
    invalidPhoneError: string;
    termsNotice: string;
  };
  otp: {
    title: string;
    subtitle: (phone: string) => string;
    otpLabel: string;
    otpPlaceholder: string;
    verifyButton: string;
    verifying: string;
    resendPrompt: string;
    resendButton: string;
    resendInSeconds: (seconds: number) => string;
    changePhone: string;
    invalidOtpError: string;
  };
  onboarding: {
    title: string;
    subtitle: string;
    stepProfile: string;
    stepPreferences: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    fullNameError: string;
    intentLabel: string;
    intentSubtitle: string;
    intents: {
      BUYER: {
        title: string;
        description: string;
      };
      OWNER: {
        title: string;
        description: string;
      };
      INVESTOR_NRN: {
        title: string;
        description: string;
      };
    };
    regionLabel: string;
    regionSubtitle: string;
    regions: {
      HILLY: {
        title: string;
        unitBadge: string;
        description: string;
        districtsSample: string;
      };
      TERAI: {
        title: string;
        unitBadge: string;
        description: string;
        districtsSample: string;
      };
    };
    districtLabel: string;
    districtPlaceholder: string;
    preferredLangLabel: string;
    submitButton: string;
    submitting: string;
  };
  promo: {
    claimBadge: string;
    claimTitle: string;
    claimDescription: string;
    claimCta: string;
    creditsHighlight: string;
    zeroBrokerageGuarantee: string;
  };
  common: {
    continue: string;
    back: string;
    cancel: string;
    languageToggle: string;
  };
}

export const authDictEn: AuthDictionary = {
  brand: {
    name: 'Sarvabhoomi Capital & Investment',
    tagline: "Nepal's Zero-Brokerage P2P Property Marketplace & Wealth Tracker",
    subTagline: 'Direct peer-to-peer real estate with verified cadastral boundaries and transparent valuation.',
  },
  phoneAuth: {
    title: 'Direct Sign-In with Mobile',
    subtitle: 'Enter your 10-digit Nepali mobile number to receive a secure one-time verification code.',
    phoneLabel: 'Nepal Mobile Number',
    phonePlaceholder: '98XXXXXXXX / 97XXXXXXXX',
    countryCodeLabel: '+977 (Nepal)',
    sendOtpButton: 'Send 6-Digit OTP',
    sendingOtp: 'Sending verification code...',
    phoneHint: 'Supported networks: Nepal Telecom (NTC) & Ncell',
    invalidPhoneError: 'Please enter a valid 10-digit NTC or Ncell mobile number.',
    termsNotice: 'By continuing, you agree to Sarvabhoomi Terms of Service and Privacy Policy.',
  },
  otp: {
    title: 'Verify Your Mobile Number',
    subtitle: (phone: string) => `We have dispatched a 6-digit verification code via SMS to +977 ${phone}`,
    otpLabel: '6-Digit Verification Code',
    otpPlaceholder: '• • • • • •',
    verifyButton: 'Verify & Continue',
    verifying: 'Authenticating...',
    resendPrompt: "Didn't receive the SMS code?",
    resendButton: 'Resend OTP',
    resendInSeconds: (seconds: number) => `Resend code in ${seconds}s`,
    changePhone: 'Change phone number',
    invalidOtpError: 'The 6-digit code you entered is invalid or has expired.',
  },
  onboarding: {
    title: 'Complete Your Investor Profile',
    subtitle: 'Customize your real estate preferences to unlock direct owner listings and smart GIS parcel analytics.',
    stepProfile: '1. Identity',
    stepPreferences: '2. Preferences & Land Units',
    fullNameLabel: 'Full Legal Name',
    fullNamePlaceholder: 'e.g., Ram Bahadur Shrestha',
    fullNameError: 'Please enter your full legal name (minimum 2 characters).',
    intentLabel: 'Your Primary Objective',
    intentSubtitle: 'Select how you intend to utilize the Sarvabhoomi platform.',
    intents: {
      BUYER: {
        title: 'Direct Property Buyer',
        description: 'Looking to purchase land or residential homes directly from owners with zero broker commission.',
      },
      OWNER: {
        title: 'Verified Property Owner / Seller',
        description: 'Listing ancestral or acquired property directly to qualified cash buyers and NRN investors.',
      },
      INVESTOR_NRN: {
        title: 'NRN / Institutional Investor',
        description: 'Building high-yield land banks, commercial plots, and tracking portfolio appreciation in Nepal.',
      },
    },
    regionLabel: 'Preferred Land Measurement System',
    regionSubtitle: 'Nepal utilizes dual measurement systems. Choose your default unit view:',
    regions: {
      HILLY: {
        title: 'Hilly & Valley Region (पहाड तथा उपत्यका)',
        unitBadge: 'Ropani - Aana - Paisa - Daam',
        description: 'Kathmandu Valley, Pokhara (Kaski), Kavre, and Hill districts.',
        districtsSample: 'Kathmandu, Lalitpur, Bhaktapur, Kaski, Kavrepalanchok, Tanahun...',
      },
      TERAI: {
        title: 'Terai Plains & Inner Terai (तराई तथा भित्री मधेस)',
        unitBadge: 'Bigha - Kattha - Dhur',
        description: 'Chitwan, Jhapa, Morang, Sunsari, Rupandehi, Banke, and Terai belt.',
        districtsSample: 'Chitwan, Rupandehi (Butwal), Jhapa, Morang (Biratnagar), Sunsari...',
      },
    },
    districtLabel: 'Primary District of Focus',
    districtPlaceholder: 'Select your primary district',
    preferredLangLabel: 'Interface Language',
    submitButton: 'Claim 15 Free Credits & Enter Marketplace',
    submitting: 'Setting up your account...',
  },
  promo: {
    claimBadge: 'Stage 1 Launch Seeding Promo',
    claimTitle: 'Claim 15 Free Contact-Unlock Credits',
    claimDescription: 'Connect directly with verified landowners without paying middleman fees. Valid for 90 days from account creation.',
    claimCta: 'Claim 15 Free Credits',
    creditsHighlight: '15 Credits = 15 Verified Landowner Direct Phone Unlocks',
    zeroBrokerageGuarantee: '100% Zero-Brokerage Verified P2P Network',
  },
  common: {
    continue: 'Continue',
    back: 'Back',
    cancel: 'Cancel',
    languageToggle: 'नेपालीमा हेर्नुहोस्',
  },
};

export const authDictNe: AuthDictionary = {
  brand: {
    name: 'सर्वभूमि क्यापिटल एन्ड इन्भेस्टमेन्ट',
    tagline: 'नेपालको पहिलो शून्य-दलाली प्रत्यक्ष जग्गा तथा घरजग्गा खरिद-बिक्री प्लेटफर्म',
    subTagline: 'बिना बिचौलिया, प्रमाणित कित्ता नापी नक्सा र पारदर्शी मूल्याङ्कन सहितको भरपर्दो सेवा।',
  },
  phoneAuth: {
    title: 'मोबाइल नम्बरबाट सहज प्रवेश',
    subtitle: 'सुरक्षित एक-पटक प्रयोग हुने कोड (OTP) प्राप्त गर्न आफ्नो १०-अङ्कको नेपाली मोबाइल नम्बर प्रविष्ट गर्नुहोस्।',
    phoneLabel: 'नेपाली मोबाइल नम्बर',
    phonePlaceholder: '९८XXXXXXXX / ९७XXXXXXXX',
    countryCodeLabel: '+९७७ (नेपाल)',
    sendOtpButton: '६-अङ्कको OTP पठाउनुहोस्',
    sendingOtp: 'प्रमाणीकरण कोड पठाइँदैछ...',
    phoneHint: 'समर्थित नेटवर्क: नेपाल टेलिकम (NTC) र एनसेल (Ncell)',
    invalidPhoneError: 'कृपया मान्य १०-अङ्कको एनटिसी वा एनसेल मोबाइल नम्बर प्रविष्ट गर्नुहोस्।',
    termsNotice: 'अगाडि बढेर, तपाईं सर्वभूमिको सेवाका सर्तहरू र गोपनीयता नीतिमा सहमत हुनुहुन्छ।',
  },
  otp: {
    title: 'मोबाइल नम्बर प्रमाणीकरण',
    subtitle: (phone: string) => `हामीले +९७७ ${phone} मा ६-अङ्कको प्रमाणीकरण कोड (SMS) पठाएका छौँ`,
    otpLabel: '६-अङ्कको OTP कोड',
    otpPlaceholder: '• • • • • •',
    verifyButton: 'प्रमाणित गर्नुहोस् र अघि बढ्नुहोस्',
    verifying: 'प्रमाणीकरण हुँदैछ...',
    resendPrompt: 'कोड प्राप्त भएन?',
    resendButton: 'पुनः कोड पठाउनुहोस्',
    resendInSeconds: (seconds: number) => `${seconds} सेकेन्डमा पुनः पठाउन सकिनेछ`,
    changePhone: 'मोबाइल नम्बर परिवर्तन गर्नुहोस्',
    invalidOtpError: 'प्रविष्ट गरिएको ६-अङ्कको कोड अमान्य छ वा म्याद समाप्त भएको छ।',
  },
  onboarding: {
    title: 'आफ्नो प्रोफाइल पूर्ण गर्नुहोस्',
    subtitle: 'प्रत्यक्ष जग्गाधनी सम्पर्क र स्मार्ट जीआईएस नापी नक्सा सुविधाहरू प्राप्त गर्न आफ्नो विवरण भर्नुहोस्।',
    stepProfile: '१. परिचय विवरण',
    stepPreferences: '२. जग्गा एकाइ तथा प्राथमिकता',
    fullNameLabel: 'पूरा कानुनी नाम',
    fullNamePlaceholder: 'उदा. राम बहादुर श्रेष्ठ',
    fullNameError: 'कृपया आफ्नो पूरा कानुनी नाम प्रविष्ट गर्नुहोस् (कम्तीमा २ अक्षर)।',
    intentLabel: 'तपाईंको मुख्य उद्देश्य',
    intentSubtitle: 'सर्वभूमि प्लेटफर्म प्रयोग गर्नुको मुख्य उद्देश्य छनोट गर्नुहोस्।',
    intents: {
      BUYER: {
        title: 'प्रत्यक्ष खरिदकर्ता (Direct Buyer)',
        description: 'कुनै पनि दलाली शुल्क बिना प्रत्यक्ष जग्गाधनीसँग जग्गा वा घर खरिद गर्न चाहने।',
      },
      OWNER: {
        title: 'जग्गाधनी / बिक्रेता (Property Owner)',
        description: 'आफ्नो नामको जग्गा सिधै वास्तविक खरिदकर्ता र एनआरएन लगानीकर्ताहरूलाई बिक्री गर्न।',
      },
      INVESTOR_NRN: {
        title: 'लगानीकर्ता / एनआरएन (Investor / NRN)',
        description: 'नेपालमा दीर्घकालीन जग्गा बैंकिङ, व्यावसायिक प्लट र पुँजी वृद्धि ट्र्याक गर्न।',
      },
    },
    regionLabel: 'जग्गा नापी एकाइ प्रणाली छनोट',
    regionSubtitle: 'नेपालमा क्षेत्र अनुसार फरक नापी एकाइ चल्छ। आफ्नो प्राथमिक प्रणाली रोज्नुहोस्:',
    regions: {
      HILLY: {
        title: 'पहाडी तथा उपत्यका क्षेत्र',
        unitBadge: 'रोपनी - आना - पैसा - दाम',
        description: 'काठमाडौँ उपत्यका, पोखरा (कास्की), काभ्रे लगायतका पहाडी जिल्लाहरूमा प्रचलित।',
        districtsSample: 'काठमाडौँ, ललितपुर, भक्तपुर, कास्की, काभ्रेपलाञ्चोक, तनहुँ...',
      },
      TERAI: {
        title: 'तराई तथा भित्री मधेस क्षेत्र',
        unitBadge: 'बिघा - कट्ठा - धुर',
        description: 'चितवन, झापा, मोरङ, सुनसरी, रूपन्देही, बाँके लगायतका तराई भूभागमा प्रचलित।',
        districtsSample: 'चितवन, रूपन्देही (बुटवल), झापा, मोरङ (विराटनगर), सुनसरी...',
      },
    },
    districtLabel: 'मुख्य ध्यान केन्द्रित जिल्ला',
    districtPlaceholder: 'आफ्नो जिल्ला छनोट गर्नुहोस्',
    preferredLangLabel: 'इन्टरफेस भाषा',
    submitButton: '१५ निःशुल्क क्रेडिट लिनुहोस् र सुरु गर्नुहोस्',
    submitting: 'खाता तयार गरिँदैछ...',
  },
  promo: {
    claimBadge: 'चरण १ लन्च प्रवर्धन अफर',
    claimTitle: '१५ निःशुल्क जग्गाधनी सम्पर्क क्रेडिट प्राप्त गर्नुहोस्',
    claimDescription: 'बिचौलिया बिना सिधै प्रमाणित जग्गाधनीहरूसँग सम्पर्क गर्नुहोस्। खाता खोलेको ९० दिनसम्म मान्य।',
    claimCta: '१५ निःशुल्क क्रेडिट दाबी गर्नुहोस्',
    creditsHighlight: '१५ क्रेडिट = १५ प्रमाणित जग्गाधनीहरूको प्रत्यक्ष फोन नम्बर अनलक',
    zeroBrokerageGuarantee: '१००% शून्य-दलाली प्रमाणित प्रत्यक्ष नेटवर्क',
  },
  common: {
    continue: 'अगाडि बढ्नुहोस्',
    back: 'पछाडि फर्कनुहोस्',
    cancel: 'रद्द गर्नुहोस्',
    languageToggle: 'View in English',
  },
};

export const AUTH_DICTIONARY = {
  en: authDictEn,
  ne: authDictNe,
} as const;

export function getAuthDict(lang: 'en' | 'ne' = 'en'): AuthDictionary {
  return AUTH_DICTIONARY[lang] || AUTH_DICTIONARY.en;
}
