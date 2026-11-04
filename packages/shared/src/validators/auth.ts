import { z } from 'zod';

/**
 * Validates 10-digit Nepal mobile numbers:
 * - NTC: 984, 985, 986, 974, 975
 * - Ncell: 980, 981, 982, 970
 */
export const nepalPhoneRegex = /^(?:98[0-24-6]|97[045])\d{7}$/;

// Validation constraints constants
export const OTP_LENGTH = 6;
export const FULL_NAME_MIN_LENGTH = 2;
export const FULL_NAME_MAX_LENGTH = 100;
export const DISTRICT_MIN_LENGTH = 2;
export const DISTRICT_MAX_LENGTH = 60;

export const OTP_REGEX = new RegExp(`^\\d{${OTP_LENGTH}}$`);

export const userIntentEnum = z.enum(['BUYER', 'OWNER', 'INVESTOR_NRN']);
export type UserIntent = z.infer<typeof userIntentEnum>;

export const regionEnum = z.enum(['HILLY', 'TERAI']);
export type PreferredRegion = z.infer<typeof regionEnum>;

/**
 * Phone authentication validation schema (Step 1: Mobile login/signup)
 */
export const phoneAuthSchema = z.object({
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/^(?:\+977|977)/, '').replace(/[-\s]/g, ''))
    .pipe(
      z
        .string()
        .regex(
          nepalPhoneRegex,
          'Invalid Nepali mobile number. Must be a 10-digit NTC or Ncell number (e.g., 9841234567, 9801234567).'
        )
    ),
});
export type PhoneAuthInput = z.infer<typeof phoneAuthSchema>;

/**
 * OTP verification schema
 */
export const otpVerificationSchema = z.object({
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/^(?:\+977|977)/, '').replace(/[-\s]/g, ''))
    .pipe(z.string().regex(nepalPhoneRegex, 'Invalid Nepali mobile number.')),
  otp: z
    .string()
    .trim()
    .length(OTP_LENGTH, `Verification OTP must be ${OTP_LENGTH} digits.`)
    .regex(OTP_REGEX, 'OTP must contain numbers only.'),
});
export type OtpVerificationInput = z.infer<typeof otpVerificationSchema>;

/**
 * User onboarding validation schema (Step 2: Profile completion)
 */
export const onboardingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(FULL_NAME_MIN_LENGTH, `Full name must be at least ${FULL_NAME_MIN_LENGTH} characters.`)
    .max(FULL_NAME_MAX_LENGTH, `Full name must not exceed ${FULL_NAME_MAX_LENGTH} characters.`),
  userIntent: userIntentEnum,
  preferredRegion: regionEnum,
  preferredDistrict: z
    .string()
    .trim()
    .min(DISTRICT_MIN_LENGTH, 'Please select or enter your primary district of interest.')
    .max(DISTRICT_MAX_LENGTH, `District name must not exceed ${DISTRICT_MAX_LENGTH} characters.`),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
