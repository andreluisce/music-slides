import { Page } from 'playwright';
import { navigateWithRetry, handleAdBlockerModal, handleConsentModal, safeAttribute, safeInnerText, cleanLyricsText } from './playwright.provider';
import { LyricsProvider } from './playwright.provider';

export class LetrasMusProvider implements LyricsProvider {
  url = 'https://www.letras.mus.br';

  async getLyrics(page: Page, title: string, artist: string): Promise<string | null> {
    const searchUrl = `${this.url}/buscar.php?q=${encodeURIComponent(`${artist} ${title}`)}`;
    console.log(`[LetrasMusProvider] Searching for lyrics on Letras.mus.br: ${searchUrl}`);

    if (!(await navigateWithRetry(page, searchUrl))) {
      console.error(`[LetrasMusProvider] Failed to navigate to search URL: ${searchUrl}`);
      return null;
    }

    await handleAdBlockerModal(page);
    await handleConsentModal(page);

    let songLink: string | null = null;

    console.log(`[LetrasMusProvider] Waiting for search results...`);
    const searchResultsLoaded = await page.waitForSelector('.gsc-webResult', { timeout: 10000 }).catch(() => {
      console.log('[LetrasMusProvider] No search results found or timed out waiting for results.');
      return null;
    });

    if (!searchResultsLoaded) {
      console.log('[LetrasMusProvider] Search results element not found after waiting.');
      return null;
    }

    const searchResults = await page.$$('.gsc-webResult');
    console.log(`[LetrasMusProvider] Found ${searchResults.length} search results.`);

    for (const result of searchResults) {
      const linkElement = await result.$('a.gs-title');
      if (linkElement) {
        const linkText = await linkElement.textContent();
        const href = await linkElement.getAttribute('href');

        if (linkText && href) {
          const lowerCaseLinkText = linkText.toLowerCase();
          const lowerCaseTitle = title.toLowerCase();
          const lowerCaseArtist = artist.toLowerCase();

          console.log(`[LetrasMusProvider] Checking link: ${linkText} - ${href}`);

          if (
            (lowerCaseLinkText.includes(lowerCaseTitle) && lowerCaseLinkText.includes(lowerCaseArtist)) ||
            (href.includes(lowerCaseTitle.replace(/ /g, '-')) && href.includes(lowerCaseArtist.replace(/ /g, '-')))
          ) {
            songLink = href;
            console.log(`[LetrasMusProvider] Found potential song link: ${songLink} with text: ${linkText}`);
            break;
          }
        }
      }
    }

    if (!songLink) {
      console.log('[LetrasMusProvider] No relevant song link found on search results page.');
      return null;
    }

    const lyricsPageUrl = songLink.startsWith(this.url) ? songLink : `${this.url}${songLink}`;
    console.log(`[LetrasMusProvider] Navigating to lyrics page: ${lyricsPageUrl}`);

    if (!(await navigateWithRetry(page, lyricsPageUrl))) {
      console.error(`[LetrasMusProvider] Failed to navigate to lyrics page: ${lyricsPageUrl}`);
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
}
