import { z } from 'zod';

export const listingTypeEnum = z.enum(['BUY_LAND', 'BUY_HOUSE', 'RENT_HOUSE', 'COMMERCIAL']);
export type ListingType = z.infer<typeof listingTypeEnum>;

export const areaUnitEnum = z.enum(['ROPANI', 'AANA', 'BIGHA', 'KATTHA', 'SQFT']);
export type AreaUnit = z.infer<typeof areaUnitEnum>;

export const propertyFacingEnum = z.enum([
  'EAST',
  'WEST',
  'NORTH',
  'SOUTH',
  'NORTH_EAST',
  'SOUTH_EAST',
  'NORTH_WEST',
  'SOUTH_WEST',
]);
export type PropertyFacing = z.infer<typeof propertyFacingEnum>;

export const propertyStatusEnum = z.enum(['ACTIVE', 'DRAFT', 'SOLD', 'PAUSED']);
export type PropertyStatus = z.infer<typeof propertyStatusEnum>;

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  listing_type: ListingType;
  price_npr: number;
  district: string;
  municipality: string | null;
  ward: number | null;
  locality: string;
  area_value: number;
  area_unit: AreaUnit;
  area_sqft: number;
  road_access: string | null;
  facing: PropertyFacing | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lalpurja_verified: boolean;
  owner_declared_lalpurja: boolean;
  admin_verified: boolean;
  kitta_no: string | null;
  photos: string[];
  status: PropertyStatus;
  views_count: number;
  unlocks_count?: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  owner?: {
    id: string;
    full_name: string | null;
    phone_np: string;
    user_intent: string | null;
  };
  is_favourited?: boolean;
  is_unlocked?: boolean;
}

export const createPropertySchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().trim().max(3000).optional(),
  listing_type: listingTypeEnum,
  price_npr: z.number().positive('Price must be greater than zero'),
  district: z.string().min(2, 'Please select a valid district'),
  municipality: z.string().trim().optional(),
  ward: z.number().int().min(1).max(50).optional(),
  locality: z.string().trim().min(2, 'Locality/landmark is required'),
  area_value: z.number().positive('Area must be greater than zero'),
  area_unit: areaUnitEnum,
  road_access: z.string().trim().optional(),
  facing: propertyFacingEnum.optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  kitta_no: z.string().trim().optional(),
  owner_declared_lalpurja: z.boolean().default(false),
  admin_verified: z.boolean().default(false),
  lalpurja_verified: z.boolean().default(false),
  photos: z.array(z.string().url()).max(10).default([]),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export interface PropertyFilterParams {
  listing_type?: ListingType;
  district?: string;
  locality?: string;
  min_price?: number;
  max_price?: number;
  area_unit?: AreaUnit;
  min_area?: number;
  max_area?: number;
  facing?: PropertyFacing;
  road_access?: string;
  lalpurja_verified?: boolean;
  owner_declared_lalpurja?: boolean;
  admin_verified?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc';
}
