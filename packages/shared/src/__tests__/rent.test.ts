import { describe, it, expect } from 'vitest';
import {
  formatMonthlyRentNPR,
  formatDeposit,
  createPropertySchema,
} from '../index';

describe('Rental Unit Helpers & Formatting', () => {
  it('formats monthly rent in English correctly', () => {
    expect(formatMonthlyRentNPR(25000, 'en')).toBe('Rs. 25,000/month');
    expect(formatMonthlyRentNPR(125000, 'en')).toBe('Rs. 1,25,000/month');
    expect(formatMonthlyRentNPR(0, 'en')).toBe('Rent on request');
    expect(formatMonthlyRentNPR(null, 'en')).toBe('Rent on request');
    expect(formatMonthlyRentNPR(undefined, 'en')).toBe('Rent on request');
  });

  it('formats monthly rent in Nepali correctly', () => {
    expect(formatMonthlyRentNPR(25000, 'ne')).toBe('रु 25,000/महिना');
    expect(formatMonthlyRentNPR(0, 'ne')).toBe('भाडा सोधपुछमा');
    expect(formatMonthlyRentNPR(null, 'ne')).toBe('भाडा सोधपुछमा');
  });

  it('formats deposit in English and Nepali correctly', () => {
    expect(formatDeposit(50000, 'en')).toBe('Rs. 50,000');
    expect(formatDeposit(50000, 'ne')).toBe('रु 50,000');
    expect(formatDeposit(0, 'en')).toBe('No Deposit');
    expect(formatDeposit(0, 'ne')).toBe('धरौटी नपर्ने');
    expect(formatDeposit(null, 'en')).toBe('Not specified');
    expect(formatDeposit(undefined, 'ne')).toBe('उल्लेख नभएको');
  });

  it('validates rental schema fields with createPropertySchema', () => {
    const validRent = {
      title: '2 BHK Modern Flat in Baluwatar',
      description: 'Fully furnished apartment',
      listing_type: 'RENT_HOUSE',
      price_npr: 45000,
      monthly_rent_npr: 45000,
      deposit_npr: 90000,
      maintenance_npr: 2000,
      maintenance_included: false,
      furnishing: 'FULLY',
      property_subtype: 'FLAT',
      preferred_tenant: 'FAMILY',
      district: 'Kathmandu',
      locality: 'Baluwatar',
      area_value: 950,
      area_unit: 'SQFT',
      bedrooms: 2,
      bathrooms: 2,
    };

    const parsed = createPropertySchema.safeParse(validRent);
    expect(parsed.success).toBe(true);
  });
});

