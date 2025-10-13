import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase environment variables not found!');
  console.error('Make sure .env file exists with:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY');
}

// Create client with typed database schema
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Export type helpers from generated types
export type { Database, Tables, TablesInsert, TablesUpdate } from './supabase-types';

// Re-export commonly used table types
export type Song = Database['public']['Tables']['songs']['Row'];
export type SongInsert = Database['public']['Tables']['songs']['Insert'];
export type SongUpdate = Database['public']['Tables']['songs']['Update'];

export type VideoBackground = Database['public']['Tables']['video_backgrounds']['Row'];
export type VideoBackgroundInsert = Database['public']['Tables']['video_backgrounds']['Insert'];
export type VideoBackgroundUpdate = Database['public']['Tables']['video_backgrounds']['Update'];

export type Theme = Database['public']['Tables']['themes']['Row'];
export type ThemeInsert = Database['public']['Tables']['themes']['Insert'];
export type ThemeUpdate = Database['public']['Tables']['themes']['Update'];

export type Presentation = Database['public']['Tables']['presentations']['Row'];
export type PresentationInsert = Database['public']['Tables']['presentations']['Insert'];
export type PresentationUpdate = Database['public']['Tables']['presentations']['Update'];

export type PresentationItem = Database['public']['Tables']['presentation_items']['Row'];
export type PresentationItemInsert = Database['public']['Tables']['presentation_items']['Insert'];
export type PresentationItemUpdate = Database['public']['Tables']['presentation_items']['Update'];

export type CustomSlide = Database['public']['Tables']['custom_slides']['Row'];
export type CustomSlideInsert = Database['public']['Tables']['custom_slides']['Insert'];
export type CustomSlideUpdate = Database['public']['Tables']['custom_slides']['Update'];

export type Tag = Database['public']['Tables']['tags']['Row'];
export type TagInsert = Database['public']['Tables']['tags']['Insert'];
export type TagUpdate = Database['public']['Tables']['tags']['Update'];

export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type FavoriteInsert = Database['public']['Tables']['favorites']['Insert'];
export type FavoriteUpdate = Database['public']['Tables']['favorites']['Update'];

export type PresentationHistory = Database['public']['Tables']['presentation_history']['Row'];
export type PresentationHistoryInsert = Database['public']['Tables']['presentation_history']['Insert'];
export type PresentationHistoryUpdate = Database['public']['Tables']['presentation_history']['Update'];

export type AppSettings = Database['public']['Tables']['app_settings']['Row'];
export type AppSettingsInsert = Database['public']['Tables']['app_settings']['Insert'];
export type AppSettingsUpdate = Database['public']['Tables']['app_settings']['Update'];

// Extended types with relationships
export interface PresentationItemWithRelations extends PresentationItem {
  song?: Song;
  custom_slide?: CustomSlide;
  theme?: Theme;
  video?: VideoBackground;
}
