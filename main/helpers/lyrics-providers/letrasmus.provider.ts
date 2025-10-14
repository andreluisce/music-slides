import { Page } from 'playwright';
import { navigateWithRetry, handleAdBlockerModal, handleConsentModal, safeAttribute, safeInnerText, cleanLyricsText, createPage } from './playwright.provider';
import { LyricsProvider } from './playwright.provider';

const LETRASMUS_URL = 'https://www.letras.mus.br';

export class LetrasMusProvider implements LyricsProvider {

  constructor() {
  }

      async getLyrics(page: Page, url: string): Promise<string | null> {
        console.log(`[LetrasMusProvider] Navigating to lyrics page: ${url}`);
    if (!(await navigateWithRetry(page, url))) {
      console.error(`[LetrasMusProvider] Failed to navigate to lyrics page: ${url}`);
      return null;
    }

    await handleAdBlockerModal(page);
    await handleConsentModal(page);

    // Extract lyrics
    const lyricsSelector = 'div.lyric-original';
    console.log(`[LetrasMusProvider] Attempting to extract lyrics with selector: ${lyricsSelector}`);
    let lyrics = await safeInnerText(page, lyricsSelector);

    if (!lyrics) {
      console.log('[LetrasMusProvider] No lyrics found with the primary selector. Trying alternative selectors.');
      // Try other common selectors if the primary one fails
      lyrics = await safeInnerText(page, 'div.cnt-letra p');
    }

    if (lyrics) {
      console.log('[LetrasMusProvider] Lyrics successfully extracted.');
      return cleanLyricsText(lyrics);
    }

    console.log('[LetrasMusProvider] Could not find lyrics on the page.');
    return null;
  }

  async searchByTitleAndArtist({ artist, title }: { artist: string; title: string }): Promise<Array<{ title: string; artist: string; url: string; }>> {
    const page = await createPage();
    try {
      const searchQuery = `${artist} ${title}`;
      const searchUrl = `${LETRASMUS_URL}/?q=${encodeURIComponent(searchQuery)}#gsc.tab=0&gsc.q=${encodeURIComponent(searchQuery)}`;
      console.log(`[LetrasMusProvider] Searching for songs on Letras.mus.br: ${searchUrl}`);

      if (!(await navigateWithRetry(page, searchUrl))) {
        console.error(`[LetrasMusProvider] Failed to navigate to search URL: ${searchUrl}`);
        return [];
      }

      await handleAdBlockerModal(page);
      await handleConsentModal(page);

      // Wait for Google Custom Search results to load
      console.log('[LetrasMusProvider] Waiting for search results to load...');
      try {
        await page.waitForSelector('.gsc-webResult', { timeout: 10000 });
        // Give a bit more time for all results to load
        await page.waitForTimeout(2000);
      } catch (error) {
        console.log('[LetrasMusProvider] No search results found or timeout waiting for results');
        return [];
      }

      const searchResults = await page.$$('.gsc-webResult');
      console.log(`[LetrasMusProvider] Found ${searchResults.length} search results.`);

      const songs: Array<{ title: string; artist: string; url: string; }> = [];
      for (const result of searchResults) {
        const linkElement = await result.$('a.gs-title');
        if (linkElement) {
          const linkText = await linkElement.textContent();
          const href = await linkElement.getAttribute('href');

          if (linkText && href) {
            console.log(`[LetrasMusProvider] Found result: "${linkText}" -> ${href}`);
            const lowerCaseLinkText = linkText.toLowerCase();
            const lowerCaseTitle = title.toLowerCase();
            const lowerCaseArtist = artist.toLowerCase();

            // More flexible matching - check if either title or artist matches
            const titleMatch = lowerCaseLinkText.includes(lowerCaseTitle) || href.includes(lowerCaseTitle.replace(/ /g, '-'));
            const artistMatch = lowerCaseLinkText.includes(lowerCaseArtist) || href.includes(lowerCaseArtist.replace(/ /g, '-'));
            
            if (titleMatch && artistMatch) {
              // Parse title and artist from link text
              let songTitle = linkText;
              let songArtist = artist;
              
              if (linkText.includes(' - ')) {
                const parts = linkText.split(' - ');
                songTitle = parts[parts.length - 1].trim(); // Last part is usually the song title
                songArtist = parts.slice(0, -1).join(' - ').trim(); // Everything before is the artist
              }
              
              songs.push({
                title: songTitle,
                artist: songArtist,
                url: href.startsWith('http') ? href : `${LETRASMUS_URL}${href}`,
              });
            }
          }
        }
      }
      
      console.log(`[LetrasMusProvider] Filtered ${songs.length} relevant songs from ${searchResults.length} total results.`);
      return songs;
    } finally {
      await page.close();
    }
  }
}
