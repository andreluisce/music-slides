import axios from 'axios';

const BIBLE_API_URL = 'https://bible-api.com';

export const getVerse = async (book: string, chapter: string, verse: string, version: string = 'almeida') => {
  try {
    const verseParam = verse ? `:${verse}` : '';
    const translationParam = version ? `?translation=${version}` : '';
    const url = `${BIBLE_API_URL}/${book}+${chapter}${verseParam}${translationParam}`;

    console.log('Fetching Bible verse:', url);
    const { data } = await axios(url);
    return data;
  } catch (error) {
    console.error('Error fetching Bible verse:', error);
    return null;
  }
};
