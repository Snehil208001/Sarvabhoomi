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

export const userRoleEnum = z.enum(['RENTER', 'OWNER']);
export type UserRole = z.infer<typeof userRoleEnum>;

/**
 * @deprecated Legacy 4-intent enum. Kept as alias to avoid breaking legacy code.
 */
export const userIntentEnum = z.enum(['BUYER', 'OWNER', 'INVESTOR_NRN', 'AGENT_BROKER']);
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
    .max(FULL_NAME_MAX_LENGTH, `Full name must not exceed ${FULL_NAME_MAX_LENGTH} characters.`)
    .optional(),
  userRole: userRoleEnum.optional(),
  userIntent: userIntentEnum.optional(),
  preferredRegion: regionEnum.optional(),
  preferredDistrict: z
    .string()
    .trim()
    .min(DISTRICT_MIN_LENGTH, 'Please select or enter your primary district of interest.')
    .max(DISTRICT_MAX_LENGTH, `District name must not exceed ${DISTRICT_MAX_LENGTH} characters.`)
    .optional(),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

/**
 * Lazy Profile Schema for prompt-on-demand requirements
 */
export const lazyProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(FULL_NAME_MIN_LENGTH, `Full name must be at least ${FULL_NAME_MIN_LENGTH} characters.`)
    .max(FULL_NAME_MAX_LENGTH, `Full name must not exceed ${FULL_NAME_MAX_LENGTH} characters.`),
  preferredDistrict: z
    .string()
    .trim()
    .min(DISTRICT_MIN_LENGTH, 'Please select your district.')
    .max(DISTRICT_MAX_LENGTH, `District name must not exceed ${DISTRICT_MAX_LENGTH} characters.`)
    .optional(),
});
export type LazyProfileInput = z.infer<typeof lazyProfileSchema>;

/**
 * Determines whether a user's profile is fully completed (both full_name and preferred_district present).
 */
export function isProfileComplete(profile: {
  full_name?: string | null;
  preferred_district?: string | null;
} | null | undefined): boolean {
  if (!profile) return false;
  const hasName = Boolean(profile.full_name && profile.full_name.trim().length >= FULL_NAME_MIN_LENGTH);
  const hasDistrict = Boolean(
    profile.preferred_district && profile.preferred_district.trim().length >= DISTRICT_MIN_LENGTH
  );
  return hasName && hasDistrict;
}

