import axios from 'axios';

const BASE_URL = 'https://api.lyrics.ovh/v1';

export const searchByTitleAndArtist = async ({ artist, title }) => {
  try {
    console.log('🎵 Lyrics.ovh searching:', artist, title);
    const url = `${BASE_URL}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const { data } = await axios.get(url);

    if (data.lyrics) {
      console.log('✅ Lyrics.ovh found lyrics');
      return {
        lyrics: data.lyrics,
        title,
        artist,
        source: 'lyrics.ovh'
      };
    }

    return null;
  } catch (error) {
    console.log('❌ Lyrics.ovh failed:', error.message);
    return null;
  }
};
