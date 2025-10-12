import { Page } from 'playwright';
import { navigateWithRetry, handleAdBlockerModal, handleConsentModal, safeAttribute, safeInnerText, cleanLyricsText } from './playwright.provider';
import { LyricsProvider } from './playwright.provider';

export class LetrasMusProvider implements LyricsProvider {
  url = 'https://www.letras.mus.br';

  async getLyrics(page: Page, title: string, artist: string): Promise<string | null> {
    const searchUrl = `${this.url}/buscar.php?q=${encodeURIComponent(`${artist} ${title}`)}`;
    console.log(`Searching for lyrics on Letras.mus.br: ${searchUrl}`);

    if (!(await navigateWithRetry(page, searchUrl))) {
      console.error(`Failed to navigate to search URL: ${searchUrl}`);
      return null;
    }

    await handleAdBlockerModal(page);
    await handleConsentModal(page);

    let songLink: string | null = null;

    // Wait for search results to load
    await page.waitForSelector('.gsc-webResult', { timeout: 10000 }).catch(() => {
      console.log('No search results found or timed out waiting for results.');
    });

    const searchResults = await page.$$('.gsc-webResult'); // Assuming .gsc-webResult is a common class for search results

    for (const result of searchResults) {
      const linkElement = await result.$('a.gs-title'); // Assuming the link is within an <a> tag with class gs-title
      if (linkElement) {
        const linkText = await linkElement.textContent();
        const href = await linkElement.getAttribute('href');

        if (linkText && href) {
          const lowerCaseLinkText = linkText.toLowerCase();
          const lowerCaseTitle = title.toLowerCase();
          const lowerCaseArtist = artist.toLowerCase();

          // Check if both title and artist are present in the link text or href
          if (
            (lowerCaseLinkText.includes(lowerCaseTitle) && lowerCaseLinkText.includes(lowerCaseArtist)) ||
            (href.includes(lowerCaseTitle.replace(/ /g, '-')) && href.includes(lowerCaseArtist.replace(/ /g, '-')))
          ) {
            songLink = href;
            console.log(`Found potential song link: ${songLink} with text: ${linkText}`);
            break;
          }
        }
      }
    }

    if (!songLink) {
      console.log('No relevant song link found on search results page.');
      return null;
    }

    const lyricsPageUrl = songLink.startsWith(this.url) ? songLink : `${this.url}${songLink}`;
    console.log(`Navigating to lyrics page: ${lyricsPageUrl}`);

    if (!(await navigateWithRetry(page, lyricsPageUrl))) {
      console.error(`Failed to navigate to lyrics page: ${lyricsPageUrl}`);
      return null;
    }

    await handleAdBlockerModal(page);
    await handleConsentModal(page);

    // Extract lyrics
    const lyricsSelector = 'div.lyric-original'; // Common selector for lyrics on Letras.mus.br
    let lyrics = await safeInnerText(page, lyricsSelector);

    if (!lyrics) {
      console.log('No lyrics found with the primary selector. Trying alternative selectors.');
      // Try other common selectors if the primary one fails
      lyrics = await safeInnerText(page, 'div.cnt-letra p');
    }

    if (lyrics) {
      return cleanLyricsText(lyrics);
    }

    console.log('Could not find lyrics on the page.');
    return null;
  }
}
