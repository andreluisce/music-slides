import * as vagalume from './lyrics-providers/vagalume.provider';
import * as genius from './lyrics-providers/genius.provider';
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
    console.log('Starting smartLyricsSearch for query:', userQuery);
    const interpretation = await getGeminiResponse({
      prompt: `User wants to find a song. Extract:
      - Likely song title
      - Likely artist
      - Genre/theme
      - Alternative titles
      
      Query: "${userQuery}"
      
      Return JSON only.`
    });

    console.log('Gemini interpretation raw:', interpretation);
    const { title, artist, alternatives } = JSON.parse(interpretation) as SongInfo;
    console.log('Parsed song info - Title:', title, 'Artist:', artist, 'Alternatives:', alternatives);

    const sources = [
      () => findByAnyParameter(`${title} ${artist}`),
      () => searchByTitleAndArtistExact({ title, artist }),
      ...(alternatives || []).map(alt => () => findByAnyParameter(`${alt.title} ${alt.artist}`)),
    ];

    for (const search of sources) {
      try {
        const result = await search();
        if (result && result.length > 0) {
          console.log('Smart search found results:', result.length);
          return result;
        }
      } catch (e) {
        console.error('Error in smart search source:', e);
        continue;
      }
    }

    console.log('Smart search found no results.');
    return [];
  } catch (error) {
    console.error('Error in smartLyricsSearch:', error);
    return [];
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
