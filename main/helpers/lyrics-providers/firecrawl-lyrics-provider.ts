import { mcpService } from '../mcp-service';
import { getGeminiResponse } from '../gemini';
import { lyricsCacheService } from '../lyrics-cache-service';
import { lyricsAnalyticsService } from '../lyrics-analytics-service';

interface SearchResult {
  artist: string;
  title: string;
  url: string;
  confidence?: number;
}

interface LyricsResult {
  artist: string;
  title: string;
  lyrics: string;
  source: string;
  metadata?: {
    album?: string;
    year?: string;
    duration?: string;
  };
}

/**
 * Advanced lyrics provider using FireCrawl MCP and Gemini AI for intelligent scraping
 */
export class FireCrawlLyricsProvider {
  private readonly firecrawlServerName = 'firecrawl-mcp';
  private readonly useAI: boolean;

  constructor(useAI: boolean = true) {
    this.useAI = useAI && !!process.env.GOOGLE_GEMINI_API_KEY;
    console.log(`[FireCrawlLyricsProvider] AI enabled: ${this.useAI}`);
  }

  /**
   * Search for songs using AI-enhanced web scraping with cache and analytics
   */
  async searchByTitleAndArtist({ artist, title }: { artist: string; title: string }): Promise<SearchResult[]> {
    const startTime = Date.now();
    let cacheHit = false;
    
    try {
      console.log(`[FireCrawlLyricsProvider] Searching for: ${artist} - ${title}`);

      // Check cache first
      const cached = await lyricsCacheService.getCachedSearchResults(artist, title, 'firecrawl');
      if (cached) {
        cacheHit = true;
        const duration = Date.now() - startTime;
        
        lyricsAnalyticsService.trackSearch({
          artist,
          title,
          source: 'firecrawl',
          resultsCount: cached.length,
          duration,
          success: true,
          cacheHit: true
        });
        
        console.log(`[FireCrawlLyricsProvider] Cache hit: ${cached.length} results`);
        return cached;
      }

      // Multiple search strategies
      const searchUrls = [
        `https://www.letras.mus.br/search/?q=${encodeURIComponent(`${artist} ${title}`)}`,
        `https://www.vagalume.com.br/busca/${encodeURIComponent(`${artist} ${title}`)}`,
        `https://www.cifraclub.com.br/buscar/?q=${encodeURIComponent(`${artist} ${title}`)}`
      ];

      const allResults: SearchResult[] = [];

      for (const searchUrl of searchUrls) {
        try {
          const results = await this.scrapeSearchResults(searchUrl, artist, title);
          allResults.push(...results);
        } catch (error) {
          console.warn(`[FireCrawlLyricsProvider] Failed to search ${searchUrl}:`, error);
        }
      }

      // Use AI to rank and filter results
      const rankedResults = await this.rankSearchResults(allResults, artist, title);
      const finalResults = rankedResults.slice(0, 10); // Return top 10 results
      
      // Cache results
      await lyricsCacheService.cacheSearchResults(artist, title, finalResults, 'firecrawl');
      
      const duration = Date.now() - startTime;
      
      // Track analytics
      lyricsAnalyticsService.trackSearch({
        artist,
        title,
        source: 'firecrawl',
        resultsCount: finalResults.length,
        duration,
        success: true,
        cacheHit: false
      });
      
      console.log(`[FireCrawlLyricsProvider] Found ${finalResults.length} relevant results in ${duration}ms`);
      return finalResults;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track failed search
      lyricsAnalyticsService.trackSearch({
        artist,
        title,
        source: 'firecrawl',
        resultsCount: 0,
        duration,
        success: false,
        error: error.message,
        cacheHit
      });
      
      console.error('[FireCrawlLyricsProvider] Search failed:', error);
      return [];
    }
  }

  /**
   * Get lyrics using FireCrawl and AI extraction with cache and analytics
   */
  async getLyrics(url: string): Promise<LyricsResult | null> {
    const startTime = Date.now();
    let cacheHit = false;
    
    try {
      console.log(`[FireCrawlLyricsProvider] Getting lyrics from: ${url}`);

      // Check cache first
      const cached = await lyricsCacheService.getCachedLyrics(url);
      if (cached) {
        cacheHit = true;
        const duration = Date.now() - startTime;
        
        lyricsAnalyticsService.trackLyricsRequest({
          url,
          artist: cached.artist,
          title: cached.title,
          source: 'firecrawl-ai',
          duration,
          success: true,
          cacheHit: true,
          lyricsLength: cached.lyrics.length
        });
        
        console.log(`[FireCrawlLyricsProvider] Cache hit for lyrics: ${cached.artist} - ${cached.title}`);
        return cached;
      }

      // Use FireCrawl to scrape the page
      const crawlResult = await mcpService.callTool(this.firecrawlServerName, 'crawl_url', {
        url,
        options: {
          formats: ['markdown', 'html'],
          includeTags: ['p', 'div', 'span', 'h1', 'h2', 'h3'],
          excludeTags: ['script', 'style', 'nav', 'footer', 'aside', 'ad'],
          waitFor: 2000
        }
      });

      if (!crawlResult.content?.[0]) {
        console.log('[FireCrawlLyricsProvider] No content extracted from page');
        return null;
      }

      const pageContent = crawlResult.content[0];
      
      // Use AI to extract structured lyrics data
      const lyricsData = await this.extractLyricsWithAI(pageContent, url);
      
      if (lyricsData) {
        const result = {
          ...lyricsData,
          source: 'firecrawl-ai'
        };
        
        // Cache the result
        await lyricsCacheService.cacheLyrics(url, result);
        
        const duration = Date.now() - startTime;
        
        // Track analytics
        lyricsAnalyticsService.trackLyricsRequest({
          url,
          artist: result.artist,
          title: result.title,
          source: 'firecrawl-ai',
          duration,
          success: true,
          cacheHit: false,
          lyricsLength: result.lyrics.length
        });
        
        console.log(`[FireCrawlLyricsProvider] Successfully extracted lyrics in ${duration}ms`);
        return result;
      }

      return null;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track failed request
      lyricsAnalyticsService.trackLyricsRequest({
        url,
        artist: 'Unknown',
        title: 'Unknown',
        source: 'firecrawl-ai',
        duration,
        success: false,
        error: error.message,
        cacheHit
      });
      
      console.error('[FireCrawlLyricsProvider] Get lyrics failed:', error);
      return null;
    }
  }

  /**
   * Scrape search results from a given URL
   */
  private async scrapeSearchResults(searchUrl: string, targetArtist: string, targetTitle: string): Promise<SearchResult[]> {
    try {
      const crawlResult = await mcpService.callTool(this.firecrawlServerName, 'crawl_url', {
        url: searchUrl,
        options: {
          formats: ['markdown'],
          includeTags: ['a', 'h1', 'h2', 'h3', 'h4', 'span', 'div'],
          excludeTags: ['script', 'style', 'nav', 'footer', 'aside'],
          waitFor: 3000
        }
      });

      if (!crawlResult.content?.[0]) {
        return [];
      }

      // Use AI to extract search results
      const searchResults = await this.extractSearchResultsWithAI(
        crawlResult.content[0], 
        targetArtist, 
        targetTitle,
        searchUrl
      );

      return searchResults || [];

    } catch (error) {
      console.error(`[FireCrawlLyricsProvider] Failed to scrape ${searchUrl}:`, error);
      return [];
    }
  }

  /**
   * Use Gemini AI to extract search results from page content
   */
  private async extractSearchResultsWithAI(content: any, targetArtist: string, targetTitle: string, sourceUrl: string): Promise<SearchResult[]> {
    if (!this.useAI) {
      console.warn('[FireCrawlLyricsProvider] AI not configured, using fallback extraction');
      return this.fallbackSearchExtraction(content, targetArtist, targetTitle);
    }

    try {
      const prompt = `Extract song search results from this webpage content. I'm looking for songs by "${targetArtist}" with title "${targetTitle}".

Page content:
${JSON.stringify(content).slice(0, 8000)}

Please extract any song results that match or are similar to the search criteria. Return ONLY a JSON array of objects with this structure:
[
  {
    "artist": "Artist Name",
    "title": "Song Title", 
    "url": "full URL to lyrics page",
    "confidence": 0.9
  }
]

Rules:
- Only include results that appear to be actual song lyrics pages
- Filter out navigation, ads, and unrelated content
- URLs should be complete (starting with http/https). If relative, prepend the base domain from: ${sourceUrl}
- Confidence should be 0.0-1.0 based on how well it matches the search
- Return ONLY the JSON array, no other text

Source URL: ${sourceUrl}`;

      const responseText = await getGeminiResponse({ prompt });
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0]);
        return Array.isArray(results) ? results : [];
      }

      return [];

    } catch (error) {
      console.warn('[FireCrawlLyricsProvider] Gemini extraction failed, using fallback:', error);
      return this.fallbackSearchExtraction(content, targetArtist, targetTitle);
    }
  }

  /**
   * Use Gemini AI to extract lyrics and metadata from page content
   */
  private async extractLyricsWithAI(content: any, sourceUrl: string): Promise<Omit<LyricsResult, 'source'> | null> {
    if (!this.useAI) {
      console.warn('[FireCrawlLyricsProvider] AI not configured, using fallback extraction');
      return this.fallbackLyricsExtraction(content);
    }

    try {
      const prompt = `Extract lyrics and song information from this webpage content.

Page content:
${JSON.stringify(content).slice(0, 12000)}

Please extract the information and return ONLY a JSON object with this structure:
{
  "artist": "Artist name",
  "title": "Song title",
  "lyrics": "Full lyrics text (clean, properly formatted)",
  "metadata": {
    "album": "Album name (if available)",
    "year": "Release year (if available)", 
    "duration": "Song duration (if available)"
  }
}

Guidelines:
- Extract the complete lyrics text, removing ads, navigation, or unrelated content
- Clean up formatting but preserve line breaks and verse structure
- If you can't find clear lyrics, return null
- Only include metadata if you're confident it's accurate
- Return ONLY the JSON object, no other text

Source URL: ${sourceUrl}`;

      const responseText = await getGeminiResponse({ prompt });
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return result.lyrics ? result : null;
      }

      return null;

    } catch (error) {
      console.warn('[FireCrawlLyricsProvider] Gemini lyrics extraction failed, using fallback:', error);
      return this.fallbackLyricsExtraction(content);
    }
  }

  /**
   * Rank search results using Gemini AI
   */
  private async rankSearchResults(results: SearchResult[], targetArtist: string, targetTitle: string): Promise<SearchResult[]> {
    if (!this.useAI || results.length === 0) {
      return results;
    }

    try {
      const prompt = `Rank these search results by relevance to the target song: "${targetArtist} - ${targetTitle}"

Results:
${JSON.stringify(results, null, 2)}

Please return the same array but reordered by relevance (most relevant first) and update the confidence scores (0.0-1.0).
Consider factors like:
- Exact artist/title matches
- Similar artist/title variations
- Reliable source domains
- URL structure indicating lyrics pages

Return ONLY the JSON array, no other text.`;

      const responseText = await getGeminiResponse({ prompt });
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const rankedResults = JSON.parse(jsonMatch[0]);
        return Array.isArray(rankedResults) ? rankedResults : results;
      }

      return results;

    } catch (error) {
      console.warn('[FireCrawlLyricsProvider] Gemini ranking failed:', error);
      return results;
    }
  }

  /**
   * Fallback search extraction without AI
   */
  private fallbackSearchExtraction(content: any, targetArtist: string, targetTitle: string): SearchResult[] {
    // Simple text-based extraction as fallback
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const results: SearchResult[] = [];
    
    // Basic pattern matching for common lyrics sites
    const patterns = [
      /letras\.mus\.br\/[^\/]+\/[^\/\s"]+/g,
      /vagalume\.com\.br\/[^\/]+\/[^\/\s"]+/g,
      /cifraclub\.com\.br\/[^\/]+\/[^\/\s"]+/g
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        if (match.includes(targetArtist.toLowerCase()) || match.includes(targetTitle.toLowerCase())) {
          results.push({
            artist: targetArtist,
            title: targetTitle,
            url: match.startsWith('http') ? match : `https://${match}`,
            confidence: 0.5
          });
        }
      });
    });

    return results;
  }

  /**
   * Fallback lyrics extraction without AI
   */
  private fallbackLyricsExtraction(content: any): Omit<LyricsResult, 'source'> | null {
    // Simple extraction as fallback
    const text = typeof content === 'string' ? content : content.markdown || content.text || '';
    
    // Try to find lyrics in common containers
    const lyricsPatterns = [
      /lyrics?[:\s]+([\s\S]+?)(?:\n\n|\r\n\r\n|$)/i,
      /letra[:\s]+([\s\S]+?)(?:\n\n|\r\n\r\n|$)/i
    ];

    for (const pattern of lyricsPatterns) {
      const match = text.match(pattern);
      if (match && match[1].length > 100) { // Ensure it's substantial content
        return {
          artist: 'Unknown Artist',
          title: 'Unknown Title',
          lyrics: match[1].trim(),
          metadata: {}
        };
      }
    }

    return null;
  }
}

// Export convenience functions
export const searchByTitleAndArtistFireCrawl = async ({ artist, title }: { artist: string; title: string }): Promise<SearchResult[]> => {
  const provider = new FireCrawlLyricsProvider(true); // Enable AI
  return provider.searchByTitleAndArtist({ artist, title });
};

export const getLyricsFireCrawl = async (url: string): Promise<LyricsResult | null> => {
  const provider = new FireCrawlLyricsProvider(true); // Enable AI
  return provider.getLyrics(url);
};