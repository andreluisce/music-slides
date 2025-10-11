import Genius from 'genius-api';

const ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

const genius = new Genius(ACCESS_TOKEN);

export const findByAnyParameter = async (searchTerm: string) => {
  try {
    const response = await genius.search(searchTerm);
    return response.hits.map((hit: any) => ({
      id: hit.result.id,
      title: hit.result.title,
      artist: hit.result.primary_artist.name,
      url: hit.result.url,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const searchByTitleAndArtistExact = async ({ artist, title }: { artist: string; title: string }) => {
  try {
    const response = await genius.search(`${artist} ${title}`);
    const song = response.hits.find((hit: any) => {
      return (
        hit.result.primary_artist.name.toLowerCase() === artist.toLowerCase() &&
        hit.result.title.toLowerCase() === title.toLowerCase()
      );
    });

    if (song) {
      const lyrics = await genius.lyrics(song.result.id);
      return { artist, title, lyrics };
    }

    return { artist, title, lyrics: '' };
  } catch (error) {
    console.error(error);
    return { artist, title, lyrics: '' };
  }
};

export const searchByTitleAndArtist = async ({ artist, title }: { artist: string; title: string }) => {
  try {
    const response = await genius.search(`${artist} ${title}`);
    return response.hits.map((hit: any) => ({
      id: hit.result.id,
      title: hit.result.title,
      artist: hit.result.primary_artist.name,
      url: hit.result.url,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};
