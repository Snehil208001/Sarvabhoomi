import { describe, it, expect } from 'vitest';
import {
  userRoleEnum,
  isProfileComplete,
  getRegionForDistrict,
} from '../index';

describe('Auth & Two-Role Validation', () => {
  it('accepts only RENTER and OWNER roles', () => {
    expect(userRoleEnum.safeParse('RENTER').success).toBe(true);
    expect(userRoleEnum.safeParse('OWNER').success).toBe(true);
  });

  it('rejects legacy 4-intent values as active roles', () => {
    expect(userRoleEnum.safeParse('BUYER').success).toBe(false);
    expect(userRoleEnum.safeParse('INVESTOR_NRN').success).toBe(false);
    expect(userRoleEnum.safeParse('AGENT_BROKER').success).toBe(false);
    expect(userRoleEnum.safeParse('ADMIN').success).toBe(false);
    expect(userRoleEnum.safeParse('').success).toBe(false);
  });
});

describe('Lazy Profile Completion Logic', () => {
  it('returns true when both full_name and preferred_district are present and valid', () => {
    expect(
      isProfileComplete({
        full_name: 'Ram Bahadur Shrestha',
        preferred_district: 'Kathmandu',
      })
    ).toBe(true);

    expect(
      isProfileComplete({
        full_name: 'Sita Sharma',
        preferred_district: 'Chitwan',
      })
    ).toBe(true);
  });

  it('returns false when full_name is missing or too short', () => {
    expect(
      isProfileComplete({
        full_name: null,
        preferred_district: 'Kathmandu',
      })
    ).toBe(false);

    expect(
      isProfileComplete({
        full_name: '',
        preferred_district: 'Kathmandu',
      })
    ).toBe(false);

    expect(
      isProfileComplete({
        full_name: 'A',
        preferred_district: 'Kathmandu',
      })
    ).toBe(false);
  });

  it('returns false when preferred_district is missing or too short', () => {
    expect(
      isProfileComplete({
        full_name: 'Ram Bahadur',
        preferred_district: null,
      })
    ).toBe(false);

    expect(
      isProfileComplete({
        full_name: 'Ram Bahadur',
        preferred_district: '',
      })
    ).toBe(false);

    expect(
      isProfileComplete({
        full_name: 'Ram Bahadur',
        preferred_district: 'K',
      })
    ).toBe(false);
  });

  it('returns false for null or undefined input', () => {
    expect(isProfileComplete(null)).toBe(false);
    expect(isProfileComplete(undefined)).toBe(false);
  });
});

describe('Cadastral Unit System Derived from District', () => {
  it('correctly derives HILLY region (Ropani-Aana system) for Hilly districts', () => {
    expect(getRegionForDistrict('Kathmandu')).toBe('HILLY');
    expect(getRegionForDistrict('Lalitpur')).toBe('HILLY');
    expect(getRegionForDistrict('Bhaktapur')).toBe('HILLY');
    expect(getRegionForDistrict('Kaski')).toBe('HILLY');
    expect(getRegionForDistrict('Kavrepalanchok')).toBe('HILLY');
  });

  it('correctly derives TERAI region (Bigha-Kattha system) for Terai districts', () => {
    expect(getRegionForDistrict('Chitwan')).toBe('TERAI');
    expect(getRegionForDistrict('Rupandehi')).toBe('TERAI');
    expect(getRegionForDistrict('Morang')).toBe('TERAI');
    expect(getRegionForDistrict('Jhapa')).toBe('TERAI');
    expect(getRegionForDistrict('Banke')).toBe('TERAI');
    expect(getRegionForDistrict('Parsa')).toBe('TERAI');
  });
});

