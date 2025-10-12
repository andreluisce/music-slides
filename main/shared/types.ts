export const SearchType = {
  ByAnyParameter: 'ByAnyParameter',
  ByTitleAndArtist: 'ByTitleAndArtist',
  ByTitleAndArtistExact: 'ByTitleAndArtistExact',
};

// Timing information for precise synchronization
export interface TimingInfo {
  startTime: number; // in seconds
  endTime: number; // in seconds
  bpm?: number; // beats per minute for this section
  emphasis?: 'start' | 'middle' | 'end'; // where to emphasize in the timing
}

// Visual styling suggestions
export interface VisualSuggestion {
  backgroundColor?: string[];
  textColor?: string;
  fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  animation?: {
    type: 'fade' | 'slide' | 'zoom' | 'bounce' | 'typewriter' | 'pulse';
    direction?: 'up' | 'down' | 'left' | 'right' | 'in' | 'out';
    duration: number; // in seconds
    delay?: number; // delay before animation starts
  };
  backgroundMedia?: {
    type: 'image' | 'video' | 'gradient';
    url?: string;
    opacity?: number;
  };
}

// Enhanced slide with advanced metadata
export interface Slide {
  id?: string; // unique identifier
  text: string;
  section: string; // e.g., "Verse 1", "Chorus", "Bridge", "Outro"
  subsection?: string; // e.g., "Pre-Chorus", "Tag", "Instrumental"
  emotion: string; // e.g., "joyful", "reflective", "powerful", "peaceful"
  intensity: number; // 1-10 scale for emotional intensity
  theme?: string; // e.g., "worship", "gratitude", "hope", "surrender"
  keywords?: string[]; // key words/concepts in this slide
  timing: TimingInfo;
  visual: VisualSuggestion;
  layoutSuggestion: string; // kept for backwards compatibility
  duration: number; // kept for backwards compatibility
  notes?: string; // manual notes/instructions
  isEditable?: boolean; // whether this slide can be manually edited
}

// Song-level metadata
export interface SongMetadata {
  id?: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  genre?: string;
  language?: string;
  overallTheme?: string;
  overallEmotion?: string;
  suggestedColors: string[];
  suggestedBibleVerses?: Array<{
    book: string;
    chapter: number;
    verse: number;
    text?: string;
  }>;
  structure: {
    intro?: number[]; // slide indices
    verses?: number[][];
    choruses?: number[][];
    bridge?: number[];
    outro?: number[];
  };
  totalDuration?: number;
  bpm?: number;
  key?: string; // musical key
  createdAt?: string;
  lastModified?: string;
  source?: string; // where the lyrics came from
}

// Complete song analysis with slides and metadata
export interface SongAnalysis {
  metadata: SongMetadata;
  slides: Slide[];
  version: string; // for schema versioning
  generatedBy: 'ai' | 'manual' | 'hybrid';
  lastAnalyzed?: string;
}
