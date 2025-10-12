import {
  createPage,
  navigateWithRetry,
  safeInnerText,
  safeAttribute,
  waitForSelector,
  cleanLyricsText,
} from './playwright.provider';

const BASE_URL = 'https://www.cifraclub.com.br';

export interface LyricResult {
  title: string;
  artist: string;
  lyrics: string;
  source: string;
}

/**
 * Search for a song on CifraClub and return the lyrics
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
    const searchUrl = `${BASE_URL}/buscar/?q=${encodeURIComponent(query)}`;

    console.log('🎸 CifraClub searching:', query);

    // Navigate to search page
    const navigated = await navigateWithRetry(page, searchUrl);
    if (!navigated) {
      console.log('❌ Failed to navigate to CifraClub search');
      return null;
    }

    // Wait for search results - try multiple selectors
    let hasResults = await waitForSelector(page, '.list--songs a', 3000);
    if (!hasResults) {
      hasResults = await waitForSelector(page, '.gs-title', 3000);
    }
    if (!hasResults) {
      hasResults = await waitForSelector(page, 'a.song-name', 3000);
    }
    if (!hasResults) {
      hasResults = await waitForSelector(page, 'a[href*="/"]', 3000);
    }

    if (!hasResults) {
      console.log('❌ No search results found on CifraClub');
      return null;
    }

    // Try different selectors for the first result
    let firstResultLink =
      (await safeAttribute(page, '.list--songs li:first-child a', 'href')) ||
      (await safeAttribute(page, 'a.song-name', 'href')) ||
      (await safeAttribute(page, '.gs-title a', 'href')) ||
      (await safeAttribute(page, 'a[href*="/' + artist.toLowerCase().replace(/\s+/g, '-') + '/"]', 'href'));

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

    // Extract lyrics immediately - page is already loaded, no need to wait!
    console.log('📝 Extracting lyrics (fast)...');

    const lyricsSelectors = ['.cifra_lyric', '.lyric', '.letra', '[class*="letra"]', 'pre'];
    let rawLyrics = null;

    for (const selector of lyricsSelectors) {
      const text = await safeInnerText(page, selector);
      if (text && text.length > 10) {
        rawLyrics = text;
        console.log(`✅ Found lyrics using selector: ${selector}`);
        break;
      }
    }

    if (!rawLyrics || rawLyrics.length < 10) {
      console.log('❌ Lyrics text is too short or empty');
      return null;
    }

    // Extract title and artist in parallel (fast!)
    console.log('🔍 Extracting title and artist...');

    const [pageTitle, pageArtist] = await Promise.all([
      // Title selectors
      (async () => {
        const titleSelectors = ['h1.t1', '.page-title', 'h1', '[class*="title"]'];
        for (const sel of titleSelectors) {
          const text = await safeInnerText(page, sel);
          if (text) return text;
        }
        return null;
      })(),
      // Artist selectors
      (async () => {
        const artistSelectors = ['h2.t2 a', '.page-subtitle a', 'h2 a', '[class*="artist"] a', '.artist-name', '.artist'];
        for (const sel of artistSelectors) {
          const text = await safeInnerText(page, sel);
          if (text) return text;
        }
        return null;
      })()
    ]);

    // Try to extract artist from URL if page selectors failed
    let extractedArtist = pageArtist || artist;
    if (!extractedArtist && songUrl) {
      const urlMatch = songUrl.match(/cifraclub\.com\.br\/([^\/]+)\//);
      if (urlMatch) {
        extractedArtist = urlMatch[1].replace(/-/g, ' ');
        console.log('   📌 Extracted artist from URL:', extractedArtist);
      }
    }

    const cleanedLyrics = cleanLyricsText(rawLyrics);

    console.log('✅ CifraClub found lyrics');
    console.log('   📝 Title:', pageTitle || title);
    console.log('   🎤 Artist:', extractedArtist);

    return {
      title: pageTitle || title,
      artist: extractedArtist,
      lyrics: cleanedLyrics,
      source: 'cifraclub',
    };
  } catch (error) {
    console.error('❌ CifraClub scraping error:', error.message);
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
    const searchUrl = `${BASE_URL}/buscar/?q=${encodeURIComponent(searchTerm)}`;

    console.log('🔍 CifraClub searching:', searchTerm);

    const navigated = await navigateWithRetry(page, searchUrl);
    if (!navigated) {
      return [];
    }

    // Try multiple selectors quickly - don't wait 10 seconds!
    console.log('🔍 Looking for search results (fast check)...');

    let hasResults = await waitForSelector(page, '.list--songs li', 2000); // Reduced from 10s to 2s
    if (!hasResults) {
      console.log('❌ List view not found, trying grid/Google search...');
      hasResults = await waitForSelector(page, '.gs-result', 2000); // Try alternative selector
      if (!hasResults) {
        console.log('❌ No search results found on CifraClub');
        return [];
      }
      console.log('✅ Using grid/Google search results');
    }

    // Get all search results
    const results = await page.$$eval('.list--songs li, .gs-result', items => {
      return items.slice(0, 10).map(item => {
        const link = item.querySelector('a');
        const titleEl = item.querySelector('.song-title, .gs-title');
        const artistEl = item.querySelector('.song-artist, .gs-artist');

        return {
          title: titleEl?.textContent?.trim() || '',
          artist: artistEl?.textContent?.trim() || '',
          url: link?.getAttribute('href') || '',
        };
      });
    });

    console.log(`✅ CifraClub found ${results.length} results`);

    return results.map(result => ({
      ...result,
      url: result.url.startsWith('http') ? result.url : `${BASE_URL}${result.url}`,
      source: 'cifraclub',
    }));
  } catch (error) {
    console.error('❌ CifraClub search error:', error.message);
    return [];
  } finally {
    await page.close();
  }
}
