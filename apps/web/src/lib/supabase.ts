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
          user_intent: 'BUYER' | 'OWNER' | 'INVESTOR_NRN' | 'AGENT_BROKER' | null;
          preferred_region: 'HILLY' | 'TERAI';
          preferred_district: string;
          preferred_lang: 'en' | 'ne';
          role: 'USER' | 'ADMIN';
          is_onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone_np: string;
          full_name?: string | null;
          user_intent?: 'BUYER' | 'OWNER' | 'INVESTOR_NRN' | 'AGENT_BROKER' | null;
          preferred_region?: 'HILLY' | 'TERAI';
          preferred_district?: string;
          preferred_lang?: 'en' | 'ne';
          role?: 'USER' | 'ADMIN';
          is_onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone_np?: string;
          full_name?: string | null;
          user_intent?: 'BUYER' | 'OWNER' | 'INVESTOR_NRN' | 'AGENT_BROKER' | null;
          preferred_region?: 'HILLY' | 'TERAI';
          preferred_district?: string;
          preferred_lang?: 'en' | 'ne';
          role?: 'USER' | 'ADMIN';
          is_onboarded?: boolean;
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
          user_intent: 'BUYER' | 'OWNER' | 'INVESTOR_NRN' | 'AGENT_BROKER' | null;
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

export interface CheckUserStatusResult {
  exists: boolean;
  is_onboarded: boolean;
  user_intent: 'BUYER' | 'OWNER' | 'INVESTOR_NRN' | 'AGENT_BROKER' | null;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

/**
 * Creates an isomorphic Supabase client with safe session persistence on browser.
 */
export function createClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
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
 * Calls public.check_user_status RPC.
 * Provides resilient fallback in case remote migrations are pending.
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
      console.warn('RPC check_user_status returned warning or pending migration:', error.message);
      // Fallback query directly on public.profiles
      const { data: profile } = await sbClient
        .from('profiles')
        .select('is_onboarded, user_intent')
        .or(`phone_np.eq.${fullPhone},phone_np.eq.${cleaned}`)
        .maybeSingle();

      if (profile) {
        return {
          exists: true,
          is_onboarded: Boolean(profile.is_onboarded),
          user_intent: profile.user_intent,
        };
      }

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
