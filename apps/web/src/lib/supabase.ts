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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

/**
 * Creates an isomorphic Supabase client with local session persistence.
 */
export function createClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Exported singleton typed Supabase client for client-side queries and mutations.
 */
export const supabase = createClient();
