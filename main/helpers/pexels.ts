import axios from 'axios';

const API_KEY = process.env.PEXELS_API_KEY;
const BASE_URL = 'https://api.pexels.com/v1';

const pexels = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: API_KEY,
  },
});

export const searchImages = async (query: string) => {
  try {
    const response = await pexels.get('/search', {
      params: {
        query,
        per_page: 10,
      },
    });
    return response.data.photos;
  } catch (error) {
    console.error('Error searching Pexels images:', error);
    return [];
  }
};

export const searchVideos = async (query: string) => {
  try {
    const response = await pexels.get('/videos/search', {
      params: {
        query,
        per_page: 10,
      },
    });
    return response.data.videos;
  } catch (error) {
    console.error('Error searching Pexels videos:', error);
    return [];
  }
};
