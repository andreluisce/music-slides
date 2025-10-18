/**
 * Centralized Song and Slide type definitions
 */

export type SlideType = 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'instrumental' | 'custom';

export interface Slide {
  id: string;
  content: string;
  type?: SlideType;
  order: number;
  metadata?: {
    duration?: number; // in seconds
    transition?: 'fade' | 'slide' | 'zoom';
    backgroundColor?: string;
    textColor?: string;
    [key: string]: any;
  };
}

export interface SongMetadata {
  createdAt?: string;
  updatedAt?: string;
  album?: string;
  year?: number;
  genre?: string;
  language?: string;
  source?: string;
  provider?: string;
  favorite?: boolean;
  tags?: string[];
  estimatedDuration?: number;
  [key: string]: any;
}

export interface Song {
  title: string;
  artist: string;

  // New format: array of slides
  slides?: Slide[];

  // Legacy format: single lyrics string (for backwards compatibility)
  lyrics?: string;

  metadata?: SongMetadata;

  // File system related
  filePath?: string;
  normalizedTitle?: string;
  normalizedArtist?: string;
}

export interface DisplaySong {
  title: string;
  artist: string;
  filePath?: string;
  isLocal: boolean;
  syncStatus: any;
  metadata?: SongMetadata;
}

/**
 * Convert lyrics string to slides array
 */
export function lyricsToSlides(lyrics: string): Slide[] {
  const lines = lyrics
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return lines.map((content, index) => {
    // Auto-detect slide type based on content
    let type: SlideType = 'verse';
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('refrão') || lowerContent.includes('chorus')) {
      type = 'chorus';
    } else if (lowerContent.includes('ponte') || lowerContent.includes('bridge')) {
      type = 'bridge';
    } else if (index === 0 && (lowerContent.includes('intro') || lowerContent.length < 30)) {
      type = 'intro';
    } else if (lowerContent.includes('instrumental')) {
      type = 'instrumental';
    }

    return {
      id: `slide-${index}-${Date.now()}`,
      content,
      type,
      order: index,
    };
  });
}

/**
 * Convert slides array back to lyrics string (for backwards compatibility)
 */
export function slidesToLyrics(slides: Slide[]): string {
  return slides
    .sort((a, b) => a.order - b.order)
    .map(slide => slide.content)
    .join('\n');
}

/**
 * Merge slide content with same type (e.g., group verses together)
 */
export function groupSlidesByType(slides: Slide[]): Slide[] {
  const grouped: Slide[] = [];
  let currentGroup: string[] = [];
  let currentType: SlideType | undefined;
  let groupOrder = 0;

  for (const slide of slides) {
    if (slide.type !== currentType) {
      // Save previous group
      if (currentGroup.length > 0 && currentType) {
        grouped.push({
          id: `group-${groupOrder}-${Date.now()}`,
          content: currentGroup.join('\n'),
          type: currentType,
          order: groupOrder++,
        });
      }
      // Start new group
      currentGroup = [slide.content];
      currentType = slide.type;
    } else {
      currentGroup.push(slide.content);
    }
  }

  // Save last group
  if (currentGroup.length > 0 && currentType) {
    grouped.push({
      id: `group-${groupOrder}-${Date.now()}`,
      content: currentGroup.join('\n'),
      type: currentType,
      order: groupOrder,
    });
  }

  return grouped;
}

/**
 * Validate slide structure
 */
export function isValidSlide(slide: any): slide is Slide {
  return (
    typeof slide === 'object' &&
    typeof slide.id === 'string' &&
    typeof slide.content === 'string' &&
    typeof slide.order === 'number'
  );
}

/**
 * Validate song structure
 */
export function isValidSong(song: any): song is Song {
  return (
    typeof song === 'object' &&
    typeof song.title === 'string' &&
    typeof song.artist === 'string' &&
    (song.slides === undefined || Array.isArray(song.slides)) &&
    (song.lyrics === undefined || typeof song.lyrics === 'string')
  );
}