import axios from 'axios';

const BIBLE_API_URL = 'https://bible-api.com';

export const getVerse = async (book: string, chapter: number, verse: number) => {
  try {
    const url = `${BIBLE_API_URL}/${book}+${chapter}:${verse}`;
    const { data } = await axios(url);
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};
