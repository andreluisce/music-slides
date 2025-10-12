import {
  createPage,
  navigateWithRetry,
  safeInnerText,
  safeAttribute,
  waitForSelector,
  cleanLyricsText,
} from './playwright.provider';

const BASE_URL = 'https://www.letras.mus.br';

export interface LyricResult {
  title: string;
  artist: string;
  lyrics: string;
  source: string;
}

/**
 * Search for a song on Letras.mus.br and return the lyrics
 */
export async function searchByTitleAndArtist({
  artist,
  title,
}: {
  artist: string;
  title: string;
}): Promise<LyricResult | null> {
  const page = await createPage();

  try {
    const query = `${artist} ${title}`.trim();
    const searchUrl = `${BASE_URL}/?q=${encodeURIComponent(query)}`;

    console.log('🎵 Letras.mus.br searching:', query);

    // Navigate to search page
    const navigated = await navigateWithRetry(page, searchUrl);
    if (!navigated) {
      console.log('❌ Failed to navigate to Letras.mus.br search');
      return null;
    }

    // Wait for search results - try multiple selectors
    let hasResults = await waitForSelector(page, '.cnt-list-songs a', 3000);
    if (!hasResults) {
      hasResults = await waitForSelector(page, 'a[href*="/"]', 3000);
    }
    if (!hasResults) {
      hasResults = await waitForSelector(page, '.songList-table a', 3000);
    }

    if (!hasResults) {
      console.log('❌ No search results found on Letras.mus.br');
      return null;
    }

    // Get the first result link - try multiple strategies
    let firstResultLink =
      (await safeAttribute(page, '.cnt-list-songs a', 'href')) ||
      (await safeAttribute(page, '.songList-table a', 'href')) ||
      (await safeAttribute(page, 'a[href*="/' + artist.toLowerCase().replace(/\s+/g, '-') + '/"]', 'href')) ||
      (await safeAttribute(page, 'a.gs-title', 'href'));

    if (!firstResultLink) {
      console.log('❌ Could not find first result link');
      return null;
    }

    const songUrl = firstResultLink.startsWith('http')
      ? firstResultLink
      : `${BASE_URL}${firstResultLink}`;

    console.log('🔗 Opening song page:', songUrl);

    // Navigate to song page
    const songPageLoaded = await navigateWithRetry(page, songUrl);
    if (!songPageLoaded) {
      console.log('❌ Failed to load song page');
      return null;
    }

    // Wait for lyrics container - try multiple selectors
    let hasLyrics = await waitForSelector(page, '.lyric-original', 3000);
    if (!hasLyrics) {
      hasLyrics = await waitForSelector(page, '.cnt-letra', 3000);
    }
    if (!hasLyrics) {
      hasLyrics = await waitForSelector(page, '[class*="lyric"]', 3000);
    }
    if (!hasLyrics) {
      hasLyrics = await waitForSelector(page, 'pre', 3000);
    }

    if (!hasLyrics) {
      console.log('❌ Lyrics container not found');
      return null;
    }

    // Extract lyrics - try multiple selectors
    let rawLyrics =
      (await safeInnerText(page, '.lyric-original')) ||
      (await safeInnerText(page, '.cnt-letra')) ||
      (await safeInnerText(page, '[class*="lyric"]')) ||
      (await safeInnerText(page, 'pre'));

    if (!rawLyrics || rawLyrics.length < 10) {
      console.log('❌ Lyrics text is too short or empty');
      return null;
    }

    // Extract title and artist from the page - try multiple selectors
    const pageTitle =
      (await safeInnerText(page, 'h1.head-title')) ||
      (await safeInnerText(page, 'h1')) ||
      (await safeInnerText(page, '.head-title'));

    const pageArtist =
      (await safeInnerText(page, 'h2.head-info-artist a')) ||
      (await safeInnerText(page, '.head-info-artist a')) ||
      (await safeInnerText(page, '.head-info-artist')) ||
      (await safeInnerText(page, 'h2 a')) ||
      (await safeInnerText(page, '.head-info a'));

    // Try to extract artist from URL if page selectors failed
    let extractedArtist = pageArtist || artist;
    if (!extractedArtist && songUrl) {
      const urlMatch = songUrl.match(/letras\.mus\.br\/([^\/]+)\//);
      if (urlMatch) {
        extractedArtist = urlMatch[1].replace(/-/g, ' ');
        console.log('   📌 Extracted artist from URL:', extractedArtist);
      }
    }

    const cleanedLyrics = cleanLyricsText(rawLyrics);

    console.log('✅ Letras.mus.br found lyrics');
    console.log('   📝 Title:', pageTitle || title);
    console.log('   🎤 Artist:', extractedArtist);

    return {
      title: pageTitle || title,
      artist: extractedArtist,
      lyrics: cleanedLyrics,
      source: 'letrasmusic',
    };
  } catch (error) {
    console.error('❌ Letras.mus.br scraping error:', error.message);
    return null;
  } finally {
    await page.close();
  }
}

/**
 * Find songs by any search term
 */
export async function findByAnyParameter(searchTerm: string): Promise<any[]> {
  const page = await createPage();

  try {
    const searchUrl = `${BASE_URL}/?q=${encodeURIComponent(searchTerm)}`;

    console.log('🔍 Letras.mus.br searching:', searchTerm);

    const navigated = await navigateWithRetry(page, searchUrl);
    if (!navigated) {
      return [];
    }

    const hasResults = await waitForSelector(page, '.cnt-list-songs li', 5000);
    if (!hasResults) {
      return [];
    }

    // Get all search results
    const results = await page.$$eval('.cnt-list-songs li', items => {
      return items.slice(0, 10).map(item => {
        const link = item.querySelector('a');
        const titleEl = item.querySelector('.song-name');
        const artistEl = item.querySelector('.song-artist');

        return {
          title: titleEl?.textContent?.trim() || '',
          artist: artistEl?.textContent?.trim() || '',
          url: link?.getAttribute('href') || '',
        };
      });
    });

    console.log(`✅ Letras.mus.br found ${results.length} results`);

    return results.map(result => ({
      ...result,
      url: result.url.startsWith('http') ? result.url : `${BASE_URL}${result.url}`,
      source: 'letrasmusic',
    }));
  } catch (error) {
    console.error('❌ Letras.mus.br search error:', error.message);
    return [];
  } finally {
    await page.close();
  }
}
