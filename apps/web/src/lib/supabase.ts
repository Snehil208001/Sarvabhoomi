import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      app_config: {
        Row: {
          id: number;
          launch_free_credits: number;
          is_gis_polygon_free: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          launch_free_credits?: number;
          is_gis_polygon_free?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          launch_free_credits?: number;
          is_gis_polygon_free?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          phone_np: string;
          full_name: string | null;
          user_role: 'RENTER' | 'OWNER' | null;
          user_intent: 'BUYER' | 'OWNER' | 'INVESTOR_NRN' | 'AGENT_BROKER' | null;
          preferred_region: 'HILLY' | 'TERAI' | null;
          preferred_district: string | null;
          preferred_lang: 'en' | 'ne';
          role: 'USER' | 'ADMIN';
          is_onboarded: boolean;
          profile_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone_np: string;
          full_name?: string | null;
          user_role?: 'RENTER' | 'OWNER' | null;
          user_intent?: 'BUYER' | 'OWNER' | 'INVESTOR_NRN' | 'AGENT_BROKER' | null;
          preferred_region?: 'HILLY' | 'TERAI' | null;
          preferred_district?: string | null;
          preferred_lang?: 'en' | 'ne';
          role?: 'USER' | 'ADMIN';
          is_onboarded?: boolean;
          profile_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone_np?: string;
          full_name?: string | null;
          user_role?: 'RENTER' | 'OWNER' | null;
          user_intent?: 'BUYER' | 'OWNER' | 'INVESTOR_NRN' | 'AGENT_BROKER' | null;
          preferred_region?: 'HILLY' | 'TERAI' | null;
          preferred_district?: string | null;
          preferred_lang?: 'en' | 'ne';
          role?: 'USER' | 'ADMIN';
          is_onboarded?: boolean;
          profile_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_tier: string;
          credits_remaining: number;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_tier?: string;
          credits_remaining?: number;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_tier?: string;
          credits_remaining?: number;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          listing_type: 'RENT_HOUSE';
          price_npr: number;
          monthly_rent_npr: number | null;
          deposit_npr: number | null;
          maintenance_npr: number | null;
          maintenance_included: boolean;
          furnishing: 'FULLY' | 'SEMI' | 'UNFURNISHED' | null;
          property_subtype: 'HOUSE' | 'FLAT' | 'ROOM' | 'SHOP' | null;
          preferred_tenant: 'FAMILY' | 'BACHELOR' | 'BACHELOR_MALE' | 'BACHELOR_FEMALE' | 'COMPANY' | 'ANY' | null;
          available_from: string | null;
          floor_no: number | null;
          total_floors: number | null;
          parking: boolean | null;
          district: string;
          municipality: string | null;
          ward: number | null;
          locality: string;
          area_value: number;
          area_unit: 'ROPANI' | 'AANA' | 'BIGHA' | 'KATTHA' | 'SQFT';
          area_sqft: number;
          road_access: string | null;
          facing: 'EAST' | 'WEST' | 'NORTH' | 'SOUTH' | 'NORTH_EAST' | 'SOUTH_EAST' | 'NORTH_WEST' | 'SOUTH_WEST' | null;
          bedrooms: number | null;
          bathrooms: number | null;
          lalpurja_verified: boolean;
          owner_declared_lalpurja: boolean;
          admin_verified: boolean;
          kitta_no: string | null;
          photos: string[];
          status: 'ACTIVE' | 'DRAFT' | 'SOLD' | 'PAUSED' | 'PENDING_REVIEW';
          views_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          listing_type: 'RENT_HOUSE';
          price_npr: number;
          monthly_rent_npr?: number | null;
          deposit_npr?: number | null;
          maintenance_npr?: number | null;
          maintenance_included?: boolean;
          furnishing?: 'FULLY' | 'SEMI' | 'UNFURNISHED' | null;
          property_subtype?: 'HOUSE' | 'FLAT' | 'ROOM' | 'SHOP' | null;
          preferred_tenant?: 'FAMILY' | 'BACHELOR' | 'BACHELOR_MALE' | 'BACHELOR_FEMALE' | 'COMPANY' | 'ANY' | null;
          available_from?: string | null;
          floor_no?: number | null;
          total_floors?: number | null;
          parking?: boolean | null;
          district: string;
          municipality?: string | null;
          ward?: number | null;
          locality: string;
          area_value: number;
          area_unit: 'ROPANI' | 'AANA' | 'BIGHA' | 'KATTHA' | 'SQFT';
          area_sqft: number;
          road_access?: string | null;
          facing?: 'EAST' | 'WEST' | 'NORTH' | 'SOUTH' | 'NORTH_EAST' | 'SOUTH_EAST' | 'NORTH_WEST' | 'SOUTH_WEST' | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          lalpurja_verified?: boolean;
          owner_declared_lalpurja?: boolean;
          admin_verified?: boolean;
          kitta_no?: string | null;
          photos?: string[];
          status?: 'ACTIVE' | 'DRAFT' | 'SOLD' | 'PAUSED' | 'PENDING_REVIEW';
          views_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          listing_type?: 'RENT_HOUSE';
          price_npr?: number;
          monthly_rent_npr?: number | null;
          deposit_npr?: number | null;
          maintenance_npr?: number | null;
          maintenance_included?: boolean;
          furnishing?: 'FULLY' | 'SEMI' | 'UNFURNISHED' | null;
          property_subtype?: 'HOUSE' | 'FLAT' | 'ROOM' | 'SHOP' | null;
          preferred_tenant?: 'FAMILY' | 'BACHELOR' | 'BACHELOR_MALE' | 'BACHELOR_FEMALE' | 'COMPANY' | 'ANY' | null;
          available_from?: string | null;
          floor_no?: number | null;
          total_floors?: number | null;
          parking?: boolean | null;
          district?: string;
          municipality?: string | null;
          ward?: number | null;
          locality?: string;
          area_value?: number;
          area_unit?: 'ROPANI' | 'AANA' | 'BIGHA' | 'KATTHA' | 'SQFT';
          area_sqft?: number;
          road_access?: string | null;
          facing?: 'EAST' | 'WEST' | 'NORTH' | 'SOUTH' | 'NORTH_EAST' | 'SOUTH_EAST' | 'NORTH_WEST' | 'SOUTH_WEST' | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          lalpurja_verified?: boolean;
          owner_declared_lalpurja?: boolean;
          admin_verified?: boolean;
          kitta_no?: string | null;
          photos?: string[];
          status?: 'ACTIVE' | 'DRAFT' | 'SOLD' | 'PAUSED' | 'PENDING_REVIEW';
          views_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      property_favourites: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_favourites_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_favourites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      contact_unlocks: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_unlocks_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_unlocks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      property_visit_requests: {
        Row: {
          id: string;
          property_id: string;
          renter_id: string;
          owner_id: string;
          visit_date: string;
          time_slot: string;
          note: string | null;
          status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          renter_id: string;
          owner_id: string;
          visit_date: string;
          time_slot: string;
          note?: string | null;
          status?: 'PENDING' | 'CONFIRMED' | 'DECLINED';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          renter_id?: string;
          owner_id?: string;
          visit_date?: string;
          time_slot?: string;
          note?: string | null;
          status?: 'PENDING' | 'CONFIRMED' | 'DECLINED';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_visit_requests_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_visit_requests_renter_id_fkey";
            columns: ["renter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_visit_requests_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      handle_new_user_subscription: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      check_user_status: {
        Args: {
          p_phone: string;
        };
        Returns: {
          exists: boolean;
          is_onboarded: boolean;
          user_role?: 'RENTER' | 'OWNER' | null;
          user_intent: 'BUYER' | 'OWNER' | 'INVESTOR_NRN' | 'AGENT_BROKER' | null;
        };
      };
      unlock_property_contact: {
        Args: {
          p_property_id: string;
        };
        Returns: {
          success: boolean;
          error?: string;
          is_owner?: boolean;
          already_unlocked?: boolean;
          unlocked_now?: boolean;
          owner_phone?: string;
          owner_name?: string;
          owner_intent?: string;
          credits_remaining?: number;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row'];
export type AppConfig = Database['public']['Tables']['app_config']['Row'];
export type PropertyRow = Database['public']['Tables']['properties']['Row'];
export type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
export type PropertyUpdate = Database['public']['Tables']['properties']['Update'];
export type PropertyFavourite = Database['public']['Tables']['property_favourites']['Row'];
export type ContactUnlock = Database['public']['Tables']['contact_unlocks']['Row'];

export interface CheckUserStatusResult {
  exists: boolean;
  is_onboarded: boolean;
  user_intent: 'BUYER' | 'OWNER' | 'INVESTOR_NRN' | 'AGENT_BROKER' | null;
}

/**
 * Validates and retrieves Supabase credentials at runtime.
 * Throws a descriptive error immediately if environment variables are missing or set to placeholder values.
 */
function getValidatedSupabaseCredentials(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || url.includes('placeholder-project') || !url.startsWith('https://')) {
    throw new Error(
      '[Sarvabhoomi] Missing or invalid NEXT_PUBLIC_SUPABASE_URL. Please set a valid Supabase project URL in your .env.local file.'
    );
  }

  if (!anonKey || anonKey.includes('placeholder-anon-key') || anonKey.trim().length < 20) {
    throw new Error(
      '[Sarvabhoomi] Missing or invalid NEXT_PUBLIC_SUPABASE_ANON_KEY. Please set a valid Supabase anon key in your .env.local file.'
    );
  }

  return { url, anonKey };
}

/**
 * Creates an isomorphic Supabase client with safe session persistence on browser.
 */
export function createClient(): SupabaseClient<Database> {
  const { url, anonKey } = getValidatedSupabaseCredentials();

  return createSupabaseClient<Database>(url, anonKey, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
    },
  });
}

/**
 * Exported singleton typed Supabase client for client-side queries and mutations.
 */
export const supabase = createClient();

/**
 * Server/Client helper to verify user status in Supabase.
 * Calls the secure public.check_user_status RPC.
 * Does NOT fallback to unthrottled direct table queries on public.profiles to prevent enumeration bypass.
 */
export async function checkUserStatus(
  phone: string,
  client?: SupabaseClient<Database>
): Promise<CheckUserStatusResult> {
  const sbClient = client ?? supabase;
  const cleaned = phone.replace(/^(?:\+977|977)/, '').replace(/[-\s]/g, '');
  const fullPhone = `+977${cleaned}`;

  try {
    const { data, error } = await sbClient.rpc('check_user_status', {
      p_phone: fullPhone,
    });

    if (error) {
      console.warn('RPC check_user_status returned error:', error.message);
      return {
        exists: false,
        is_onboarded: false,
        user_intent: null,
      };
    }

    if (data && typeof data === 'object') {
      const res = data as CheckUserStatusResult;
      return {
        exists: Boolean(res.exists),
        is_onboarded: Boolean(res.is_onboarded),
        user_intent: res.user_intent || null,
      };
    }

    return {
      exists: false,
      is_onboarded: false,
      user_intent: null,
    };
  } catch (err) {
    console.error('Error invoking checkUserStatus:', err);
    return {
      exists: false,
      is_onboarded: false,
      user_intent: null,
    };
  }
}
