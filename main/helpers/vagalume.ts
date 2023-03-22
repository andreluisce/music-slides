const API_KEY = '?apikey=7532676aa4e8bc204bd89b21476cf45a';
const EXCERPT_URL = 'https://api.vagalume.com.br/search.excerpt';
const ARTIST_MUSIC = 'https://api.vagalume.com.br/search.artmus';
const SEARCH_URL = 'https://api.vagalume.com.br/search.php';

import axios from 'axios';

export const findByAnyParameter = async searchTerm => {
  try {
    const url = `${EXCERPT_URL}${API_KEY}&q=${encodeURIComponent(searchTerm)}`;
    const { data } = await axios(url);

    return data?.response?.docs || [];
  } catch (error) {
    console.error(error);
  }
};

export const searchByTitleAndArtistExact = async ({ artist, title }) => {
  const url = `${SEARCH_URL}${API_KEY}&mus=${encodeURIComponent(title)}&art=${encodeURIComponent(
    artist.replace(/\s+/g, '')
  )}`;

  const { data } = await axios(url);

  return { artist, title, lyrics: data.mus?.[0]?.text };
};

export const searchByTitleAndArtist = async ({ artist, title }) => {
  try {
    const url = `${ARTIST_MUSIC}${API_KEY}&q=${encodeURIComponent(
      `${artist.replace(/\s+/g, '')} ${title}`
    )}`;
    const { data } = await axios(url);

    return data?.response?.docs || [];
  } catch (error) {
    console.error(error);
  }
};
