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

    // Try to find the song link
    const songLinkSelector = `a[data-share-url*="${artist.toLowerCase().replace(/ /g, '-')}/${title.toLowerCase().replace(/ /g, '-')}"]`;
    let songLink = await safeAttribute(page, songLinkSelector, 'href');

    if (!songLink) {
      // Fallback: search for a more general link if the specific one isn't found
      const generalSongLinkSelector = `a.song-name-link:has-text("${title}")`;
      songLink = await safeAttribute(page, generalSongLinkSelector, 'href');
    }

    if (!songLink) {
      console.log('No song link found on search results page.');
      return null;
    }

    const lyricsPageUrl = `${this.url}${songLink}`;
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
