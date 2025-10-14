import * as cheerio from 'cheerio';

// Base URL for Letras.mus.br
const LETRASMUS_BASE_URL = 'https://www.letras.mus.br';

// Types for the provider responses
export interface SearchResult {
  title: string;
  artist: string;
  url: string;
  source: 'letrasmusic';
}

export interface LyricsResult {
  title: string;
  artist: string;
  lyrics: string;
  source: 'letrasmusic';
}

/**
 * Fetches HTML content from a URL with proper headers and error handling
 */
async function fetchHtml(url: string): Promise<string> {
  console.log(`[LetrasMusic] Fetching: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`[LetrasMusic] Successfully fetched ${html.length} characters`);
    return html;
  } catch (error) {
    console.error(`[LetrasMusic] Failed to fetch ${url}:`, error);
    throw error;
  }
}

/**
 * Cleans up text by removing extra whitespace and normalizing line breaks
 */
function cleanText(text: string): string {
  return text
    .replace(/[\t ]+/g, ' ') // Replace multiple spaces/tabs with single space
    .trim();
}

/**
 * Cleans up lyrics text specifically
 */
function cleanLyrics(text: string): string {
  return text
    .split('\n')
    .map(line => line.trim()) // Trim each line
    .join('\n') // Join with newlines
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive line breaks
    .replace(/\r\n/g, '\n') // Normalize line breaks
    .replace(/\r/g, '\n') // Handle old Mac line breaks
    .trim();
}

/**
 * Searches for songs by artist and title on Letras.mus.br
 * 
 * @param options - Search parameters
 * @param options.artist - Artist name
 * @param options.title - Song title
 * @returns Array of search results
 */
export async function searchByTitleAndArtist({ 
  artist, 
  title 
}: { 
  artist: string; 
  title: string; 
}): Promise<SearchResult[]> {
  console.log(`[LetrasMusic] Searching for: "${artist}" - "${title}"`);
  
  try {
    // Build search query and URL
    const searchQuery = `${artist} ${title}`;
    const searchUrl = `${LETRASMUS_BASE_URL}/?q=${encodeURIComponent(searchQuery)}#gsc.tab=0&gsc.q=${encodeURIComponent(searchQuery)}`;
    
    console.log(`[LetrasMusic] Search URL: ${searchUrl}`);
    
    // Fetch the search page HTML
    const html = await fetchHtml(searchUrl);
    
    // Parse HTML with Cheerio
    const $ = cheerio.load(html);
    
    // Wait a moment for potential dynamic content (though we're not using browser)
    // Note: In a real scenario, we might need to handle the Google Custom Search results differently
    // For now, we'll look for immediate results in the HTML
    
    const results: SearchResult[] = [];
    
    // Look for Google Custom Search results
    $('.gsc-webResult').each((index, element) => {
      try {
        const $element = $(element);
        const $link = $element.find('a.gs-title');
        
        if ($link.length > 0) {
          const linkText = $link.text().trim();
          const href = $link.attr('href');
          
          if (linkText && href) {
            console.log(`[LetrasMusic] Found result: "${linkText}" -> ${href}`);
            
            const lowerCaseLinkText = linkText.toLowerCase();
            const lowerCaseTitle = title.toLowerCase();
            const lowerCaseArtist = artist.toLowerCase();
            
            // Flexible matching - check if both title and artist match
            const titleMatch = lowerCaseLinkText.includes(lowerCaseTitle) || 
                              href.includes(lowerCaseTitle.replace(/ /g, '-'));
            const artistMatch = lowerCaseLinkText.includes(lowerCaseArtist) || 
                               href.includes(lowerCaseArtist.replace(/ /g, '-'));
            
            if (titleMatch && artistMatch) {
              // Parse title and artist from link text
              let songTitle = linkText;
              let songArtist = artist;
              
              if (linkText.includes(' - ')) {
                const parts = linkText.split(' - ');
                // Usually format is: "Song Title - Artist Name - LETRAS.MUS.BR"
                if (parts.length >= 2) {
                  songTitle = parts[0].trim();
                  songArtist = parts[1].replace(' - LETRAS.MUS.BR', '').trim();
                }
              }
              
              const fullUrl = href.startsWith('http') ? href : `${LETRASMUS_BASE_URL}${href}`;
              
              results.push({
                title: songTitle,
                artist: songArtist,
                url: fullUrl,
                source: 'letrasmusic'
              });
            }
          }
        }
      } catch (error) {
        console.error(`[LetrasMusic] Error processing search result ${index}:`, error);
      }
    });
    
    // If no Google Custom Search results, try alternative approaches
    if (results.length === 0) {
      console.log('[LetrasMusic] No Google Custom Search results found, trying alternative approaches...');
      
      // Try direct search approach - construct likely URLs
      const artistSlug = artist.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const titleSlug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      
      const possibleUrls = [
        `${LETRASMUS_BASE_URL}/${artistSlug}/${titleSlug}/`,
        `${LETRASMUS_BASE_URL}/${artistSlug}/${titleSlug}.html`,
        `${LETRASMUS_BASE_URL}/${artistSlug}/`,
      ];
      
      // Try each possible URL to see if it exists
      for (const url of possibleUrls) {
        try {
          console.log(`[LetrasMusic] Trying direct URL: ${url}`);
          const testResponse = await fetch(url, { method: 'HEAD' });
          if (testResponse.ok) {
            console.log(`[LetrasMusic] Found direct URL: ${url}`);
            results.push({
              title: title,
              artist: artist,
              url: url,
              source: 'letrasmusic'
            });
            break;
          }
        } catch (error) {
          // URL doesn't exist, continue to next
        }
      }
      
      // Also look for any song links on the current page
      $('a[href*="letras.mus.br"]').each((index, element) => {
        try {
          const $element = $(element);
          const linkText = $element.text().trim();
          const href = $element.attr('href');
          
          if (linkText && href && linkText.length > 5 && !href.includes('#') && !href.includes('?')) {
            const lowerCaseLinkText = linkText.toLowerCase();
            const lowerCaseTitle = title.toLowerCase();
            const lowerCaseArtist = artist.toLowerCase();
            
            // More flexible matching
            if ((lowerCaseLinkText.includes(lowerCaseTitle.split(' ')[0]) || 
                 lowerCaseLinkText.includes(lowerCaseArtist.split(' ')[0])) &&
                href.includes('/')) {
              
              const fullUrl = href.startsWith('http') ? href : `${LETRASMUS_BASE_URL}${href}`;
              
              results.push({
                title: linkText,
                artist: artist,
                url: fullUrl,
                source: 'letrasmusic'
              });
            }
          }
        } catch (error) {
          console.error(`[LetrasMusic] Error processing link ${index}:`, error);
        }
      });
    }
    
    console.log(`[LetrasMusic] Found ${results.length} matching results`);
    
    // Remove duplicates based on URL
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
    );
    
    console.log(`[LetrasMusic] Returning ${uniqueResults.length} unique results`);
    return uniqueResults;
    
  } catch (error) {
    console.error('[LetrasMusic] Search failed:', error);
    return [];
  }
}

/**
 * Extracts lyrics from a Letras.mus.br song page
 * 
 * @param url - URL of the song page
 * @returns Lyrics data or null if not found
 */
export async function getLyrics(url: string): Promise<LyricsResult | null> {
  console.log(`[LetrasMusic] Extracting lyrics from: ${url}`);
  
  try {
    // Fetch the lyrics page HTML
    const html = await fetchHtml(url);
    
    // Parse HTML with Cheerio
    const $ = cheerio.load(html);
    
    // Extract lyrics using multiple selectors (in order of preference)
    let lyrics = '';
    const lyricsSelectors = [
      '.lyric-original',
      '.cnt-letra p',
      '.lyric-content',
      '.letra-musica',
      '.lyrics'
    ];
    
    for (const selector of lyricsSelectors) {
      const $lyricsElement = $(selector);
      if ($lyricsElement.length > 0) {
        lyrics = $lyricsElement.text().trim();
        console.log(`[LetrasMusic] Found lyrics using selector: ${selector}`);
        break;
      }
    }
    
    if (!lyrics) {
      console.log('[LetrasMusic] No lyrics found with any selector');
      return null;
    }
    
    // Extract title from page
    let title = '';
    const titleSelectors = ['h1', '.head-title', '.song-title', 'title'];
    
    for (const selector of titleSelectors) {
      const $titleElement = $(selector);
      if ($titleElement.length > 0) {
        title = cleanText($titleElement.text());
        // Clean up title if it contains site name
        title = title.replace(' - LETRAS.MUS.BR', '').trim();
        if (title) {
          console.log(`[LetrasMusic] Found title using selector: ${selector} -> "${title}"`);
          break;
        }
      }
    }
    
    // Extract artist from page
    let artist = '';
    const artistSelectors = [
      '.head-info-artist a',
      '.lyric-artist a',
      '.artist-name',
      '.head-info a'
    ];
    
    for (const selector of artistSelectors) {
      const $artistElement = $(selector);
      if ($artistElement.length > 0) {
        artist = cleanText($artistElement.text());
        if (artist) {
          console.log(`[LetrasMusic] Found artist using selector: ${selector} -> "${artist}"`);
          break;
        }
      }
    }
    
    // If we couldn't extract title/artist from page, try to parse from URL
    if (!title || !artist) {
      const urlParts = url.split('/');
      if (urlParts.length >= 4) {
        // URL format is usually: https://www.letras.mus.br/artist-name/song-name/
        const artistFromUrl = urlParts[3].replace(/-/g, ' ');
        const titleFromUrl = urlParts[4] ? urlParts[4].replace(/-/g, ' ') : '';
        
        if (!artist && artistFromUrl) {
          artist = artistFromUrl;
          console.log(`[LetrasMusic] Extracted artist from URL: "${artist}"`);
        }
        if (!title && titleFromUrl) {
          title = titleFromUrl;
          console.log(`[LetrasMusic] Extracted title from URL: "${title}"`);
        }
      }
    }
    
    // Clean up the lyrics text
    const cleanedLyrics = cleanLyrics(lyrics);
    
    if (!cleanedLyrics) {
      console.log('[LetrasMusic] Lyrics text is empty after cleaning');
      return null;
    }
    
    const result: LyricsResult = {
      title: title || 'Unknown Title',
      artist: artist || 'Unknown Artist',
      lyrics: cleanedLyrics,
      source: 'letrasmusic'
    };
    
    console.log(`[LetrasMusic] Successfully extracted lyrics: "${result.title}" by "${result.artist}" (${cleanedLyrics.length} characters)`);
    return result;
    
  } catch (error) {
    console.error(`[LetrasMusic] Failed to extract lyrics from ${url}:`, error);
    return null;
  }
}

// Export a class-based interface for compatibility with existing code
export class LetrasMusProvider {
  constructor() {}
  
  async searchByTitleAndArtist(params: { artist: string; title: string }): Promise<SearchResult[]> {
    return searchByTitleAndArtist(params);
  }
  
  async getLyrics(url: string): Promise<LyricsResult | null> {
    return getLyrics(url);
  }
}

// Default export for convenience
export default {
  searchByTitleAndArtist,
  getLyrics,
  LetrasMusProvider
};