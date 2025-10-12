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
      prompt: `Format and clean the following lyrics for a presentation slide show:
      - Fix capitalization, punctuation, and common typos.
      - Detect and clearly mark sections like [Verse 1], [Chorus], [Bridge], [Outro].
      - Remove any duplicate lines or sections.
      - Split the lyrics into optimal slide lengths, aiming for 2-4 meaningful lines per slide.
      - Ensure each slide break is logical and doesn't cut a phrase mid-sentence.
      - Return only the formatted lyrics, with each slide content separated by a unique delimiter like "---SLIDE_BREAK---".
      
      Lyrics: """${lyrics}"""
      
      Example of desired output format:
      [Verse 1]
      Line 1
      Line 2
      ---SLIDE_BREAK---
      Line 3
      Line 4
      ---SLIDE_BREAK---
      [Chorus]
      Chorus Line 1
      Chorus Line 2
      ---SLIDE_BREAK---
      Chorus Line 3
      Chorus Line 4
      
      Return only the formatted lyrics, nothing else.`
    });
    return formattedLyrics.split('---SLIDE_BREAK---').map(s => s.trim()).filter(Boolean);
  } catch (error) {
    console.error('Error formatting lyrics:', error);
    return lyrics.split('\n').map(s => s.trim()).filter(Boolean);
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
    const colorPalette = await getGeminiResponse({
      prompt: `Analyze the mood and emotion of the following song lyrics and suggest a matching color palette for a presentation background. Return a JSON array of 3-5 hex color codes, suitable for a gradient or theme.
      
      Lyrics: """${lyrics}"""
      
      Example of desired output format:
      ["#RRGGBB", "#RRGGBB", "#RRGGBB"]
      
      Return JSON array only.`
    });
    return JSON.parse(colorPalette);
  } catch (error) {
    console.error('Error suggesting theme colors:', error);
    return ['#000000', '#FFFFFF']; // Default colors
  }
};

export const suggestBibleVerses = async (lyrics: string) => {
  try {
    const bibleVerses = await getGeminiResponse({
      prompt: `Analyze the themes and messages in the following song lyrics and suggest 3-5 relevant Bible verses. For each verse, provide the book, chapter, and verse number. Return a JSON array of objects, where each object has 'book', 'chapter', and 'verse' properties.

      Lyrics: """${lyrics}"""

      Example of desired output format:
      [
        { "book": "John", "chapter": 3, "verse": 16 },
        { "book": "Psalm", "chapter": 23, "verse": 1 }
      ]

      Return JSON array only.`
    });
    return JSON.parse(bibleVerses);
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
