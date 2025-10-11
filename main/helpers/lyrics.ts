import * as vagalume from './lyrics-providers/vagalume.provider';
import * as genius from './lyrics-providers/genius.provider';
import * as lyricsovh from './lyrics-providers/lyricsovh.provider';
import { interpretLyricsQuery, cleanLyrics } from './ai-service';
import { getGeminiResponse } from './gemini';
import { SearchType } from '../../renderer/shared/types';

interface SongInfo {
  title: string;
  artist: string;
  alternatives?: { title: string; artist: string }[];
  genre?: string;
  theme?: string;
}

export const smartLyricsSearch = async (userQuery: string) => {
  try {
    console.log('🔍 Starting smart search for:', userQuery);

    // Step 1: AI interprets the vague/fuzzy query
    const interpretation = await interpretLyricsQuery(userQuery);
    const { title, artist, alternatives, confidence } = interpretation;

    console.log(`🤖 AI Interpretation (${confidence}% confidence):`, {
      title,
      artist,
      alternatives: alternatives.length
    });

    // Step 2: Try multiple sources in priority order
    const searchAttempts = [
      // Primary attempt with AI interpretation
      {
        name: 'Lyrics.ovh (Primary)',
        search: () => lyricsovh.searchByTitleAndArtist({ title, artist })
      },
      {
        name: 'Genius (Primary)',
        search: () => genius.searchByTitleAndArtistExact({ title, artist })
      },
      {
        name: 'Vagalume (Primary)',
        search: () => vagalume.searchByTitleAndArtistExact({ title, artist })
      },
      // Try alternatives
      ...alternatives.flatMap(alt => [
        {
          name: `Lyrics.ovh (Alt: ${alt.title})`,
          search: () => lyricsovh.searchByTitleAndArtist({ title: alt.title, artist: alt.artist })
        },
        {
          name: `Genius (Alt: ${alt.title})`,
          search: () => genius.searchByTitleAndArtistExact({ title: alt.title, artist: alt.artist })
        }
      ]),
      // Broad search as last resort
      {
        name: 'Broad search (Genius)',
        search: () => findByAnyParameter(`${title} ${artist}`)
      }
    ];

    // Try each source
    for (const attempt of searchAttempts) {
      try {
        console.log(`🔎 Trying: ${attempt.name}`);
        const result = await attempt.search();

        if (result) {
          // Handle different response formats
          if (Array.isArray(result)) {
            if (result.length > 0) {
              console.log(`✅ Found ${result.length} results via ${attempt.name}`);
              return result;
            }
          } else if (result.lyrics && result.lyrics.length > 0) {
            console.log(`✅ Found lyrics via ${attempt.name}`);
            // Convert single result to array format
            return [{
              title: result.title,
              artist: result.artist,
              url: `/lyrics/${encodeURIComponent(result.artist)}/${encodeURIComponent(result.title)}.html`,
              lyrics: result.lyrics
            }];
          }
        }
      } catch (error) {
        console.log(`❌ ${attempt.name} failed:`, error.message);
        continue;
      }
    }

    console.log('❌ No results found from any source');
    return [];
  } catch (error) {
    console.error('❌ Error in smartLyricsSearch:', error);
    // Fallback to basic search
    return findByAnyParameter(userQuery);
  }
};

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
