import { z } from 'zod';

/**
 * Validates 10-digit Nepal mobile numbers:
 * - NTC: 984, 985, 986, 974, 975
 * - Ncell: 980, 981, 982, 970
 */
export const nepalPhoneRegex = /^(?:98[0-24-6]|97[045])\d{7}$/;

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
    .length(6, 'Verification OTP must be 6 digits.')
    .regex(/^\d{6}$/, 'OTP must contain numbers only.'),
});
export type OtpVerificationInput = z.infer<typeof otpVerificationSchema>;

/**
 * User onboarding validation schema (Step 2: Profile completion)
 */
export const onboardingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name must not exceed 100 characters.'),
  userIntent: userIntentEnum,
  preferredRegion: regionEnum,
  preferredDistrict: z
    .string()
    .trim()
    .min(2, 'Please select or enter your primary district of interest.')
    .max(60, 'District name must not exceed 60 characters.'),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
