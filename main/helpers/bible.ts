import axios from 'axios';

const BIBLE_API_URL = 'https://bible-api.com';

export const getVerse = async (book: string, chapter: string, verse: string) => {
  try {
    const verseParam = verse ? `:${verse}` : '';
    const url = `${BIBLE_API_URL}/${book}+${chapter}${verseParam}`;
    console.log('Fetching Bible verse:', url);
    const { data } = await axios(url);
    return data;
  } catch (error) {
    console.error('Error fetching Bible verse:', error);
    return null;
  }
};
