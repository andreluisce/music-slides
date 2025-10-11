import * as vagalume from './lyrics-providers/vagalume.provider';

export const findByAnyParameter = async (searchTerm: string) => {
  return await vagalume.findByAnyParameter(searchTerm);
};

export const searchByTitleAndArtistExact = async ({ artist, title }: { artist: string; title: string }) => {
  return await vagalume.searchByTitleAndArtistExact({ artist, title });
};

export const searchByTitleAndArtist = async ({ artist, title }: { artist: string; title: string }) => {
  return await vagalume.searchByTitleAndArtist({ artist, title });
};
