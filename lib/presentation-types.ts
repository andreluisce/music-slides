// Types for Presentations (Service Orders / Worship Sets)

export type PresentationStatus = 'draft' | 'ready' | 'presented' | 'archived';

export type PresentationItemType = 'song' | 'bible' | 'image' | 'video' | 'text' | 'theme';

export interface Presentation {
  id: string;
  name: string;
  description?: string;
  date?: string; // ISO date
  status: PresentationStatus;
  thumbnail_url?: string;
  notes?: any;
  created_at: string;
  updated_at: string;
}

export interface PresentationItem {
  id: string;
  presentation_id: string;
  item_type: PresentationItemType;
  item_data: PresentationItemData;
  order_index: number;
  duration_estimate?: number; // seconds
  notes?: string;
  created_at: string;
}

// Union type for different item data structures
export type PresentationItemData =
  | SongItemData
  | BibleItemData
  | ImageItemData
  | VideoItemData
  | TextItemData
  | ThemeItemData;

export interface SongItemData {
  song_id?: string;
  artist: string;
  title: string;
  lyrics?: string;
  file_path?: string;
}

export interface BibleItemData {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end?: number;
  version: string; // 'NVI', 'ARC', etc
  text?: string;
}

export interface ImageItemData {
  url: string;
  title?: string;
  caption?: string;
}

export interface VideoItemData {
  url: string;
  title?: string;
  start_time?: number; // seconds
  end_time?: number;
}

export interface TextItemData {
  content: string;
  font_size?: number;
  font_family?: string;
  text_color?: string;
  background_color?: string;
}

export interface ThemeItemData {
  theme_name: string;
  colors?: {
    primary?: string;
    secondary?: string;
    text?: string;
    background?: string;
  };
}

export interface PresentationHistory {
  id: string;
  presentation_id?: string;
  presented_at: string;
  duration_seconds?: number;
  notes?: string;
}

// Helper to create a new empty presentation
export const createEmptyPresentation = (): Omit<Presentation, 'id' | 'created_at' | 'updated_at'> => ({
  name: 'Nova Apresentação',
  status: 'draft',
  date: new Date().toISOString().split('T')[0],
});

// Helper to create a new presentation item
export const createPresentationItem = (
  type: PresentationItemType,
  data: PresentationItemData,
  order: number
): Omit<PresentationItem, 'id' | 'presentation_id' | 'created_at'> => ({
  item_type: type,
  item_data: data,
  order_index: order,
});
