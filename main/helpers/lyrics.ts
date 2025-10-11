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
    const interpretation = await getGeminiResponse({
      prompt: `User wants to find a song. Extract:
      - Likely song title
      - Likely artist
      - Genre/theme
      - Alternative titles
      
      Query: "${userQuery}"
      
      Return JSON only.`
    });

    const { title, artist, alternatives } = JSON.parse(interpretation) as SongInfo;

    const sources = [
      () => findByAnyParameter(`${title} ${artist}`),
      () => searchByTitleAndArtistExact({ title, artist }),
      ...(alternatives || []).map(alt => () => findByAnyParameter(`${alt.title} ${alt.artist}`)),
    ];

    for (const search of sources) {
      try {
        const result = await search();
        if (result && result.length > 0) return result;
      } catch (e) {
        console.error('Error in smart search source:', e);
        continue;
      }
    }

    return [];
  } catch (error) {
    console.error('Error in smartLyricsSearch:', error);
    return [];
  }
};

export const formatLyrics = async (lyrics: string) => {
  try {
    const formattedLyrics = await getGeminiResponse({
      prompt: `Format and clean the following lyrics:
      - Fix capitalization, punctuation
      - Detect verse/chorus/bridge structure
      - Remove duplicate lines
      - Split into optimal slide lengths (around 4-6 lines per slide)
      
      Lyrics: """${lyrics}"""
      
      Return only the formatted lyrics, no extra text.`
    });
    return formattedLyrics.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error formatting lyrics:', error);
    return lyrics.split('\n').filter(Boolean);
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
