import * as vagalume from './lyrics-providers/vagalume.provider';
import * as genius from './lyrics-providers/genius.provider';
import * as lyricsovh from './lyrics-providers/lyricsovh.provider';
import { interpretLyricsQuery, cleanLyrics } from './ai-service';
import { getGeminiResponse } from './gemini';
import { SearchType } from '../../renderer/shared/types';
import { intelligentLyricsSearch } from './lyrics-agent';

interface SongInfo {
  title: string;
  artist: string;
  alternatives?: { title: string; artist: string }[];
  genre?: string;
  theme?: string;
}


export const formatLyrics = async (lyrics: string) => {
  try {
    const formattedLyrics = await getGeminiResponse({
      prompt: `Format and clean the following lyrics for a presentation slide show. The lyrics are for a worship song, likely in Portuguese or English. Return a JSON array of objects, where each object represents a slide.

      Each slide MUST have between 2 and 4 lines of text.
      Each slide MUST have a maximum of 15 words.
      If a slide contains multiple phrases, break the line between them to improve readability.

      Each object must have the following properties:
      - "text": The text content of the slide.
      - "section": The lyrical section (e.g., "Verse 1", "Chorus", "Bridge", "Outro").
      - "emotion": The emotional tone of the slide (e.g., "joyful", "reflective", "powerful").
      - "layoutSuggestion": A suggestion for the layout (e.g., "centered-large-font", "bottom-aligned", "two-columns").
      - "duration": The estimated duration of the slide in seconds (e.g., 5.5).
      
      Lyrics: """${lyrics}"""
      
      Example of desired output format:
      [
        {
          "text": "Line 1\nLine 2",
          "section": "Verse 1",
          "emotion": "reflective",
          "layoutSuggestion": "bottom-aligned",
          "duration": 7.2
        },
        {
          "text": "Chorus Line 1\nChorus Line 2",
          "section": "Chorus",
          "emotion": "powerful",
          "layoutSuggestion": "centered-large-font",
          "duration": 10.0
        }
      ]
      
      Return a valid JSON array only.`
    });

    const jsonRegex = /```json\n([\s\S]*?)\n```/;
    const match = formattedLyrics.match(jsonRegex);

    let slides;
    if (match && match[1]) {
      slides = JSON.parse(match[1]);
    } else {
      slides = JSON.parse(formattedLyrics);
    }
    return slides;
  } catch (error) {
    console.error('Error formatting lyrics:', error);
    // Fallback to simple splitting
    return lyrics.split('\n').map(s => ({ text: s.trim(), section: 'Verse', emotion: 'neutral', layoutSuggestion: 'default', duration: 5 })).filter(s => s.text);
  }
};

export const findByAnyParameter = async (searchTerm: string) => {
  console.log('🔍 Searching for:', searchTerm);

  let results = await vagalume.findByAnyParameter(searchTerm);
  console.log('📊 Vagalume results:', results?.length || 0, 'songs');

  if (!results || results.length === 0) {
    console.log('🔄 Trying Genius API as fallback...');
    results = await genius.findByAnyParameter(searchTerm);
    console.log('📊 Genius results:', results?.length || 0, 'songs');
  }

  return results || [];
};

export const searchByTitleAndArtistExact = async ({ artist, title }: { artist: string; title: string }) => {
  let result = await vagalume.searchByTitleAndArtistExact({ artist, title });
  if (!result || !result.lyrics) {
    result = await genius.searchByTitleAndArtistExact({ artist, title });
  }
  return result || { artist, title, lyrics: '' };
};

export const searchByTitleAndArtist = async ({ artist, title }: { artist: string; title: string }) => {
  let results = await vagalume.searchByTitleAndArtist({ artist, title });
  if (!results || results.length === 0) {
    results = await genius.searchByTitleAndArtist({ artist, title });
  }
  return results || [];
};

export const suggestThemeColors = async (lyrics: string) => {
  try {
    const colorPaletteResponse = await getGeminiResponse({
      prompt: `Analyze the mood and emotion of the following song lyrics, which are from a worship song (likely in Portuguese or English), and suggest a matching color palette for a presentation background. Return a JSON array of 3-5 hex color codes, suitable for a gradient or theme.
      
      Lyrics: """${lyrics}"""
      
      Example of desired output format:
      ["#RRGGBB", "#RRGGBB", "#RRGGBB"]
      
      Return JSON array only.`
    });

    const jsonRegex = /```json\n([\s\S]*?)\n```/;
    const match = colorPaletteResponse.match(jsonRegex);

    let colorPalette;
    if (match && match[1]) {
      colorPalette = JSON.parse(match[1]);
    } else {
      colorPalette = JSON.parse(colorPaletteResponse);
    }

    return colorPalette;
  } catch (error) {
    console.error('Error suggesting theme colors:', error);
    return ['#000000', '#FFFFFF']; // Default colors
  }
};

export const suggestBibleVerses = async (lyrics: string, theme?: string) => {
  try {
    const bibleVersesResponse = await getGeminiResponse({
      prompt: `Analyze the themes and messages in the following song lyrics, which are from a worship song (likely in Portuguese or English), and suggest 3-5 relevant Bible verses. ${theme ? `Focus on the theme of \"${theme}\".` : ''} For each verse, provide the book, chapter, and verse number. Return a JSON array of objects, where each object has 'book', 'chapter', and 'verse' properties.

      Lyrics: """${lyrics}"""

      Example of desired output format:
      [
        { "book": "John", "chapter": 3, "verse": 16 },
        { "book": "Psalm", "chapter": 23, "verse": 1 }
      ]

      Return JSON array only.`
    });

    const jsonRegex = /```json\n([\s\S]*?)\n```/;
    const match = bibleVersesResponse.match(jsonRegex);

    let bibleVerses;
    if (match && match[1]) {
      bibleVerses = JSON.parse(match[1]);
    } else {
      bibleVerses = JSON.parse(bibleVersesResponse);
    }

    return bibleVerses;
  } catch (error) {
    console.error('Error suggesting Bible verses:', error);
    return [];
  }
};

/**
 * Advanced lyrics search with 3-level fallback system
 * 1. Supabase cache (cloud)
 * 2. Local cache (file system)
 * 3. Web scraping (Playwright - Letras.mus.br, CifraClub)
 *
 * Automatically saves results to both Supabase and local storage
 */
export const advancedLyricsSearch = async (userQuery: string) => {
  try {
    console.log('🚀 Starting advanced lyrics search for:', userQuery);
    const result = await intelligentLyricsSearch(userQuery);

    if (!result) {
      console.log('❌ No lyrics found via advanced search');
      return null;
    }

    console.log(`✅ Advanced search successful via ${result.source}`);

    return {
      title: result.title,
      artist: result.artist,
      lyrics: result.lyrics,
      source: result.source,
      metadata: result.metadata,
    };
  } catch (error) {
    console.error('❌ Advanced lyrics search failed:', error);
    return null;
  }
};
