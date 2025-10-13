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

export async function getLyrics(url: string): Promise<LyricResult | null> {
  console.log('   🚀 Starting getLyrics for:', url);
  const page = await createPage();

  try {
    console.log('   🌐 Navigating directly to song page:', url);

    const songPageLoaded = await navigateWithRetry(page, url);
    if (!songPageLoaded) {
      console.log('   ❌ Failed to load song page from direct URL');
      return null;
    }

    console.log('   ✅ Song page loaded successfully from direct URL');

    // Extract lyrics
    console.log('   📝 Extracting lyrics...');

    const lyricsSelectors = ['.cifra_lyric', '.lyric', '.letra', '[class*="letra"]', 'pre'];
    let rawLyrics = null;

    for (const selector of lyricsSelectors) {
      const text = await safeInnerText(page, selector);
      if (text && text.length > 10) {
        rawLyrics = text;
        console.log(`   ✅ Found lyrics using selector: ${selector}`);
        break;
      }
    }

    if (!rawLyrics || rawLyrics.length < 10) {
      console.log('   ❌ Lyrics text is too short or empty');
      return null;
    }

    // Extract title and artist in parallel
    console.log('   🔍 Extracting title and artist...');

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
    let extractedArtist = pageArtist || '';
    if (!extractedArtist && url) {
      const urlMatch = url.match(/cifraclub\.com\.br\/([^\/]+)\//);
      if (urlMatch) {
        extractedArtist = urlMatch[1].replace(/-/g, ' ');
        console.log('   📌 Extracted artist from URL:', extractedArtist);
      }
    }

    const cleanedLyrics = cleanLyricsText(rawLyrics);

    console.log('   ✅ CifraClub found lyrics successfully!');
    console.log(`   📝 Final title: "${pageTitle || 'Unknown Title'}"`);
    console.log(`   🎤 Final artist: "${extractedArtist || 'Unknown Artist'}"`);
    console.log(`   📝 Cleaned lyrics length: ${cleanedLyrics.length}`);

    return {
      title: pageTitle || 'Unknown Title',
      artist: extractedArtist || 'Unknown Artist',
      lyrics: cleanedLyrics,
      source: 'cifraclub',
    };
  } catch (error) {
    console.error('   ❌ CifraClub direct scraping error:', error.message);
    return null;
  } finally {
    await page.close();
    console.log('   🛑 Finished getLyrics.');
  }
}

export async function searchByTitleAndArtist({
  artist,
  title,
}: {
  artist: string;
  title: string;
}): Promise<SongSearchResult[]> {
  const page = await createPage();
  const results: SongSearchResult[] = [];

  try {
    const query = `${artist} ${title}`.trim();
    const searchUrl = `${BASE_URL}/buscar/?q=${encodeURIComponent(query)}`;

    console.log('🎸 CifraClub searching:', query);

    const navigated = await navigateWithRetry(page, searchUrl);
    if (!navigated) {
      console.log('❌ Failed to navigate to CifraClub search');
      return [];
    }

    let hasResults = await waitForSelector(page, '.list--songs li', 2000);
    if (!hasResults) {
      console.log('❌ List view not found, trying grid/Google search...');
      hasResults = await waitForSelector(page, '.gs-result', 2000);
      if (!hasResults) {
        console.log('❌ No search results found on CifraClub');
        return [];
      }
      console.log('✅ Using grid/Google search results');
    }

    const searchItems = await page.$('.list--songs li, .gs-result');

    for (let i = 0; i < Math.min(searchItems.length, 10); i++) {
      const item = searchItems[i];

      const link = await item.$('a');
      const titleEl = await item.$('.song-title, .gs-title');
      const artistEl = await item.$('.song-artist, .gs-artist');

      const url = link ? await link.getAttribute('href') : '';
      const titleText = titleEl ? await titleEl.textContent() : '';
      const artistText = artistEl ? await artistEl.textContent() : '';

      if (!url) continue;

      const cleanUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

      results.push({
        title: titleText?.trim() || '',
        artist: artistText?.trim() || '',
        url: cleanUrl,
        source: 'cifraclub',
      });
    }

    console.log(`✅ CifraClub found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('❌ CifraClub search error:', error.message);
    return [];
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
