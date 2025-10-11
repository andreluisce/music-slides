import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase environment variables not found!');
  console.error('Make sure .env.local exists with:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create client with fallback values to prevent errors
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Types for our database
export interface Song {
  id: string;
  title: string;
  artist: string;
  lyrics: string[];
  is_local: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoBackground {
  id: string;
  name: string;
  url: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface Theme {
  id: string;
  name: string;
  font_family: string;
  font_size: number;
  font_weight: number;
  text_color: string;
  text_shadow: string;
  text_outline: string;
  background_position: string;
  animation_type: string;
  is_default: boolean;
  created_at: string;
}

export interface Presentation {
  id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PresentationItem {
  id: string;
  presentation_id: string;
  item_type: 'song' | 'custom_slide' | 'image' | 'video';
  song_id?: string;
  custom_slide_id?: string;
  theme_id?: string;
  video_id?: string;
  order_index: number;
  settings?: Record<string, any>;
  created_at: string;
  // Relationships
  song?: Song;
  custom_slide?: CustomSlide;
  theme?: Theme;
  video?: VideoBackground;
}

export interface CustomSlide {
  id: string;
  title?: string;
  content: string;
  slide_type: 'text' | 'image' | 'announcement';
  background_color: string;
  background_image_url?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  item_type: 'song' | 'presentation' | 'theme' | 'video';
  item_id: string;
  created_at: string;
}

export interface PresentationHistory {
  id: string;
  presentation_id?: string;
  presented_at: string;
  duration_seconds?: number;
  notes?: string;
}
