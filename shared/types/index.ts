export const SearchType = {
  ByAnyParameter: 'ByAnyParameter',
  ByTitleAndArtist: 'ByTitleAndArtist',
  ByTitleAndArtistExact: 'ByTitleAndArtistExact',
};

export interface Slide {
  id?: string;
  text: string;
  section: string;
  emotion: string;
  layoutSuggestion: string;
  duration: number;
  intensity?: number;
  timing?: {
    startTime: number;
    endTime: number;
    bpm: number;
    emphasis: string;
  };
  visual?: {
    backgroundColor: string[];
    textColor: string;
    fontSize: string;
    fontWeight: string;
    textAlign: string;
    animation: {
      type: string;
      direction: string;
      duration: number;
      delay: number;
    };
    backgroundMedia: {
      type: string;
      opacity: number;
    };
  };
  isEditable?: boolean;
}

export interface SongAnalysis {
  metadata: {
    id: string;
    title: string;
    artist: string;
    genre: string;
    language: string;
    overallTheme: string;
    overallEmotion: string;
    suggestedColors: string[];
    structure: { verses: any[]; choruses: any[]; }; // Adjust 'any' as needed
    createdAt: string;
    lastModified: string;
  };
  slides: Slide[];
  version: string;
  generatedBy: 'ai' | 'manual' | 'hybrid' | 'fallback'; // Add 'fallback'
  lastAnalyzed: string;
}