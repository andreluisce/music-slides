import { Playwright, chromium } from 'playwright';

interface SearchResult {
  artist: string;
  title: string;
  url: string;
}

interface LyricsResult {
  artist: string;
  title: string;
  lyrics: string;
  source: string;
}

export const searchByTitleAndArtist = async ({ artist, title }: { artist: string; title: string }): Promise<SearchResult[]> => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const searchQuery = encodeURIComponent(`${artist} ${title}`);
    await page.goto(`https://www.letras.mus.br/search/${searchQuery}`);

    // Wait for search results
    await page.waitForSelector('.gs-title', { timeout: 5000 });

    // Get all search results
    const results = await page.evaluate(() => {
      const items = document.querySelectorAll('.gs-result');
      return Array.from(items).map((item) => {
        const titleElement = item.querySelector('.gs-title');
        const link = titleElement?.querySelector('a[href]');
        const url = link?.getAttribute('href') || '';
        const fullTitle = titleElement?.textContent?.trim() || '';
        
        // Extract artist and title from the full title
        const match = fullTitle.match(/^(.+?)\s*-\s*(.+)$/);
        const [artist, title] = match ? [match[1].trim(), match[2].trim()] : [fullTitle, ''];

        return { artist, title, url };
      }).filter(r => r.url && r.artist && r.title);
    });

    return results;
  } finally {
    await browser.close();
  }
};

export const getLyrics = async (url: string): Promise<LyricsResult | null> => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url);

    // Wait for lyrics container
    await page.waitForSelector('.lyric-original', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const artistElement = document.querySelector('.lyric-provider-header h1 a');
      const titleElement = document.querySelector('.lyric-provider-header h2');
      const lyricsElement = document.querySelector('.lyric-original');

      if (!artistElement || !titleElement || !lyricsElement) return null;

      const artist = artistElement.textContent?.trim() || '';
      const title = titleElement.textContent?.trim() || '';
      const lyrics = lyricsElement.textContent?.trim() || '';

      return { artist, title, lyrics };
    });

    if (!result) return null;

    return {
      ...result,
      source: 'letrasmusic'
    };
  } finally {
    await browser.close();
  }
};

export const findByAnyParameter = async (query: string): Promise<SearchResult[]> => {
  return searchByTitleAndArtist({ artist: '', title: query });
};