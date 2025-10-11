import * as vagalume from './lyrics-providers/vagalume.provider';
import * as genius from './lyrics-providers/genius.provider';

export const findByAnyParameter = async (searchTerm: string) => {
  let results = await vagalume.findByAnyParameter(searchTerm);
  if (!results || results.length === 0) {
    results = await genius.findByAnyParameter(searchTerm);
  }
  return results;
};

export const searchByTitleAndArtistExact = async ({ artist, title }: { artist: string; title: string }) => {
  let result = await vagalume.searchByTitleAndArtistExact({ artist, title });
  if (!result || !result.lyrics) {
    result = await genius.searchByTitleAndArtistExact({ artist, title });
  }
  return result;
};

export const searchByTitleAndArtist = async ({ artist, title }: { artist: string; title: string }) => {
  let results = await vagalume.searchByTitleAndArtist({ artist, title });
  if (!results || results.length === 0) {
    results = await genius.searchByTitleAndArtist({ artist, title });
  }
  return results;
};
