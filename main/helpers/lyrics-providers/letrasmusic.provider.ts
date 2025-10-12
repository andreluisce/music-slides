import {
  createPage,
  navigateWithRetry,
  safeInnerText,
  safeAttribute,
  waitForSelector,
  cleanLyricsText,
  handleAdBlockerModal,
  takeScreenshot,
  handleConsentModal,
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

    // Handle modals quickly
    await handleAdBlockerModal(page);
    await handleConsentModal(page);

    // Wait for search results - try multiple selectors in parallel for speed
    console.log('🔍 Looking for search results (fast check)...');

    // Try all common selectors at once with short timeout
    const resultSelectors = ['.gs-title', '.cnt-list-songs a', '.songList-table a', 'a[href*="/"]'];
    let hasResults = false;

    for (const selector of resultSelectors) {
      const found = await waitForSelector(page, selector, 2000); // Only wait 2s max
      if (found) {
        console.log(`✅ Found results using selector: ${selector}`);
        hasResults = true;
        break;
      }
    }

    if (!hasResults) {
      console.log('❌ No search results found on Letras.mus.br');
      return null;
    }

    // Get the first result link - prioritize Google Custom Search results
    let firstResultLink =
      (await safeAttribute(page, 'a.gs-title', 'href')) ||
      (await safeAttribute(page, '.cnt-list-songs a', 'href')) ||
      (await safeAttribute(page, '.songList-table a', 'href')) ||
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

    console.log('✅ Song page loaded successfully');

    // Handle consent modal on song page too (quick check)
    await Promise.race([
      handleConsentModal(page),
      new Promise(resolve => setTimeout(resolve, 1000)) // Don't wait more than 1s for modals
    ]);

    // Extract lyrics using the native "Copy" feature - SUPER FAST!
    console.log('📝 Extracting lyrics using native copy button (instant)...');

    let rawLyrics = null;

    try {
      // Need to trigger the selection menu first by selecting some text
      console.log('🖱️  Triggering selection menu...');

      // Find the lyrics container and select some text to trigger the menu
      await page.evaluate(() => {
        const lyricsContainer = document.querySelector('.lyric-original, .cnt-letra');
        if (lyricsContainer) {
          // Create a selection to trigger the menu
          const range = document.createRange();
          range.selectNodeContents(lyricsContainer);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);

          // Trigger selection event
          const event = new Event('mouseup', { bubbles: true });
          lyricsContainer.dispatchEvent(event);
        }
      });

      // Wait a tiny bit for the menu to appear
      await page.waitForTimeout(200);

      // Now click the "Copy All" button using its ID
      const copyAllButton = page.locator('#js-selectionOptions-copyAll');
      const isVisible = await copyAllButton.isVisible().catch(() => false);

      if (isVisible) {
        console.log('✅ Found copy button, clicking it...');
        await copyAllButton.click();

        // Wait a moment for clipboard to be populated
        await page.waitForTimeout(100);

        // Get the copied text from clipboard
        rawLyrics = await page.evaluate(async () => {
          try {
            return await navigator.clipboard.readText();
          } catch (e) {
            return null;
          }
        });

        if (rawLyrics && rawLyrics.length > 10) {
          console.log('✅ Lyrics copied from clipboard successfully!');
        }
      } else {
        console.log('⚠️  Copy button not visible, trying fallback');
      }
    } catch (error) {
      console.log('⚠️  Copy button method failed:', error.message);
    }

    // Fallback: Extract from DOM if copy button didn't work
    if (!rawLyrics || rawLyrics.length < 10) {
      console.log('📝 Using fallback DOM extraction...');
      const lyricsSelectors = ['.lyric-original', '.cnt-letra', '[class*="lyric"]', '.letra-cnt'];

      for (const selector of lyricsSelectors) {
        const text = await safeInnerText(page, selector);
        if (text && text.length > 10) {
          rawLyrics = text;
          console.log(`✅ Found lyrics using selector: ${selector}`);
          break;
        }
      }
    }

    console.log(`📝 Raw lyrics length: ${rawLyrics?.length || 0}`);
    if (rawLyrics) {
      console.log(`📝 Lyrics preview: ${rawLyrics.substring(0, 100)}...`);
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
        const titleSelectors = ['h1.head-title', 'h1', '.head-title'];
        for (const sel of titleSelectors) {
          const text = await safeInnerText(page, sel);
          if (text) return text;
        }
        return null;
      })(),
      // Artist selectors
      (async () => {
        const artistSelectors = ['h2.head-info-artist a', '.head-info-artist a', '.head-info-artist', 'h2 a', '.head-info a'];
        for (const sel of artistSelectors) {
          const text = await safeInnerText(page, sel);
          if (text) return text;
        }
        return null;
      })()
    ]);

    console.log(`📝 Page title: "${pageTitle}"`);
    console.log(`🎤 Page artist: "${pageArtist}"`);

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

    console.log('✅ Letras.mus.br found lyrics successfully!');
    console.log(`   📝 Final title: "${pageTitle || title}"`);
    console.log(`   🎤 Final artist: "${extractedArtist}"`);
    console.log(`   📝 Cleaned lyrics length: ${cleanedLyrics.length}`);

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

    // Handle modals quickly (don't wait too long)
    await Promise.race([
      Promise.all([handleAdBlockerModal(page), handleConsentModal(page)]),
      new Promise(resolve => setTimeout(resolve, 1500)) // Max 1.5s for modals
    ]);

    // Try multiple selectors quickly - don't wait 8 seconds!
    console.log('🔍 Looking for search results...');

    let hasResults = await waitForSelector(page, '.gs-title', 3000); // Reduced from 8s to 3s
    if (!hasResults) {
      console.log('❌ Google Custom Search not found, trying fallback...');
      hasResults = await waitForSelector(page, '.cnt-list-songs li', 2000); // Reduced from 3s to 2s
      if (!hasResults) {
        return [];
      }
      console.log('✅ Using fallback selectors');

      // Get fallback results using manual element handling
      const fallbackItems = await page.$$('.cnt-list-songs li');
      const fallbackResults = [];

      for (let i = 0; i < Math.min(fallbackItems.length, 10); i++) {
        const item = fallbackItems[i];

        const link = await item.$('a');
        const titleEl = await item.$('.song-name');
        const artistEl = await item.$('.song-artist');

        const url = link ? await link.getAttribute('href') : '';
        const title = titleEl ? await titleEl.textContent() : '';
        const artist = artistEl ? await artistEl.textContent() : '';

        if (!url) continue;

        const cleanUrl = url?.startsWith('http') ? url : `${BASE_URL}${url}`;

        // FILTER: Only include URLs that are specific songs
        const songUrlPattern = /letras\.mus\.br\/[^\/]+\/[^\/]+\/?$/;
        const isSpecificSong = songUrlPattern.test(cleanUrl);

        const excludePatterns = [
          /mais-tocadas/i,
          /mais-acessadas/i,
          /top-/i,
          /playlist/i,
          /\/$/, // Just artist page
        ];

        const shouldExclude = excludePatterns.some(pattern => pattern.test(cleanUrl));

        if (!isSpecificSong || shouldExclude) {
          console.log(`⏭️  Skipping non-song URL: ${cleanUrl}`);
          continue;
        }

        if (title || artist || url) {
          fallbackResults.push({
            title: title?.trim() || '',
            artist: artist?.trim() || '',
            url: cleanUrl,
            source: 'letrasmusic',
          });
        }
      }

      console.log(`✅ Found ${fallbackResults.length} specific song results (fallback)`);
      return fallbackResults;
    }

    console.log('✅ Found Google Custom Search results');

    // Get Google Custom Search results - avoid transpilation by using manual element handling
    const linkElements = await page.$$('a.gs-title');
    const results = [];

    for (let i = 0; i < Math.min(linkElements.length, 10); i++) {
      const link = linkElements[i];

      const url = await link.getAttribute('href');
      const titleText = await link.textContent();

      if (!titleText || !url) {
        continue;
      }

      const cleanUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

      // FILTER: Only include URLs with format /artist-name/song-id/
      // The second segment (song-id) is what makes it a specific song page
      const songUrlPattern = /letras\.mus\.br\/([^\/]+)\/([^\/]+)\/?$/;
      const urlMatch = cleanUrl.match(songUrlPattern);

      if (!urlMatch) {
        console.log(`⏭️  Skipping - invalid URL format: ${cleanUrl}`);
        continue;
      }

      const [, artistSlug, songId] = urlMatch;

      // FILTER: Exclude common non-song pages by checking the slug patterns
      const excludePatterns = [
        /mais-tocadas/i,
        /mais-acessadas/i,
        /top-/i,
        /playlist/i,
      ];

      const shouldExclude = excludePatterns.some(pattern =>
        pattern.test(artistSlug) || pattern.test(songId)
      );

      if (shouldExclude) {
        console.log(`⏭️  Skipping generic page: ${cleanUrl}`);
        continue;
      }

      // Validate that songId looks like an actual song ID (not a generic page)
      // Song IDs on Letras.mus.br are typically song titles in kebab-case
      if (!songId || songId.length < 2) {
        console.log(`⏭️  Skipping - invalid song ID: ${cleanUrl}`);
        continue;
      }

      let title = '';
      let artist = '';

      // Clean and parse the title text
      const cleanText = titleText.replace(/\s*-\s*LETRAS\.MUS\.BR.*$/i, '').trim();

      // FILTER: Skip if text indicates it's a generic page (not a song)
      const genericPagePatterns = [
        /página do artista/i,
        /enviar letras/i,
        /traduções/i,
        /e mais/i,
        /^[^-]+$/,  // No " - " separator means it's likely not a song title
      ];

      const isGenericPage = genericPagePatterns.some(pattern => pattern.test(cleanText));

      if (isGenericPage) {
        console.log(`⏭️  Skipping generic page: ${cleanText}`);
        continue;
      }

      const parts = cleanText.split(' - ');

      // MUST have at least 2 parts (title - artist) to be a valid song
      if (parts.length < 2) {
        console.log(`⏭️  Skipping - no title/artist separator: ${cleanText}`);
        continue;
      }

      title = parts[0].trim();
      artist = parts[1].trim();

      // Validate that we have both title and artist
      if (!title || !artist) {
        console.log(`⏭️  Skipping - empty title or artist: ${cleanText}`);
        continue;
      }

      results.push({
        title: title || 'Música sem título',
        artist: artist || 'Artista desconhecido',
        url: cleanUrl,
      });
    }

    console.log(`✅ Letras.mus.br found ${results.length} specific song results`);

    // Add source to each result
    for (let i = 0; i < results.length; i++) {
      results[i].source = 'letrasmusic';
    }
    
    return results;
  } catch (error) {
    console.error('❌ Letras.mus.br search error:', error.message);
    return [];
  } finally {
    await page.close();
  }
}
