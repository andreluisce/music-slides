import { invoke } from '@tauri-apps/api/core';

interface SearchResult {
  artist: string;
  title: string;
  url: string;
}

interface LyricsResult {
  artist: string;
  title: string;
  lyrics: string;
  source: string;
}

/**
 * Lyrics provider using Playwright MCP for more reliable scraping
 * This replaces the direct browser management approach with MCP calls
 */
export class MCPLyricsProvider {
  private readonly baseUrl = 'https://www.letras.mus.br';

  /**
   * Search for songs by title and artist using MCP Playwright
   */
  async searchByTitleAndArtist({ artist, title }: { artist: string; title: string }): Promise<SearchResult[]> {
    try {
      const searchQuery = encodeURIComponent(`${artist} ${title}`);
      const searchUrl = `${this.baseUrl}/search/${searchQuery}`;
      
      console.log(`[MCPLyricsProvider] Searching: ${searchUrl}`);

      // Navigate to search page
      await this.mcpNavigate(searchUrl);
      
      // Wait for search results to load
      await this.mcpWaitFor({ text: 'gs-title' });
      
      // Take snapshot to see current page state
      const snapshot = await this.mcpSnapshot();
      
      // Extract search results using evaluate
      const results = await this.mcpEvaluate(`
        () => {
          const items = document.querySelectorAll('.gs-result');
          return Array.from(items).map((item) => {
            const titleElement = item.querySelector('.gs-title');
            const link = titleElement?.querySelector('a[href]');
            const url = link?.getAttribute('href') || '';
            const fullTitle = titleElement?.textContent?.trim() || '';
            
            // Extract artist and title from the full title
            const match = fullTitle.match(/^(.+?)\\s*-\\s*(.+)$/);
            const [artist, title] = match ? [match[1].trim(), match[2].trim()] : [fullTitle, ''];

            return { artist, title, url };
          }).filter(r => r.url && r.artist && r.title);
        }
      `);

      console.log(`[MCPLyricsProvider] Found ${results.length} results`);
      return results;

    } catch (error) {
      console.error('[MCPLyricsProvider] Search failed:', error);
      return [];
    }
  }

  /**
   * Get lyrics from a specific URL using MCP Playwright
   */
  async getLyrics(url: string): Promise<LyricsResult | null> {
    try {
      console.log(`[MCPLyricsProvider] Getting lyrics from: ${url}`);

      // Navigate to lyrics page
      await this.mcpNavigate(url);
      
      // Wait for lyrics to load
      await this.mcpWaitFor({ text: 'lyric-original' });
      
      // Extract lyrics data
      const result = await this.mcpEvaluate(`
        () => {
          const artistElement = document.querySelector('.lyric-provider-header h1 a');
          const titleElement = document.querySelector('.lyric-provider-header h2');
          const lyricsElement = document.querySelector('.lyric-original');

          if (!artistElement || !titleElement || !lyricsElement) return null;

          const artist = artistElement.textContent?.trim() || '';
          const title = titleElement.textContent?.trim() || '';
          const lyrics = lyricsElement.textContent?.trim() || '';

          return { artist, title, lyrics };
        }
      `);

      if (!result) {
        console.log('[MCPLyricsProvider] No lyrics data found');
        return null;
      }

      return {
        ...result,
        source: 'letrasmusic-mcp'
      };

    } catch (error) {
      console.error('[MCPLyricsProvider] Get lyrics failed:', error);
      return null;
    }
  }

  /**
   * Search by any parameter (free text search)
   */
  async findByAnyParameter(query: string): Promise<SearchResult[]> {
    return this.searchByTitleAndArtist({ artist: '', title: query });
  }

  // MCP Helper Methods
  private async mcpNavigate(url: string): Promise<void> {
    await invoke('mcp_playwright_invoke', {
      tool_name: 'browser_navigate',
      tool_input: { url }
    });
  }

  private async mcpWaitFor(options: { time?: number; text?: string; textGone?: string }): Promise<void> {
    await invoke('mcp_playwright_invoke', {
      tool_name: 'browser_wait_for',
      tool_input: options
    });
  }

  private async mcpSnapshot(): Promise<any> {
    return await invoke('mcp_playwright_invoke', {
      tool_name: 'browser_snapshot',
      tool_input: {}
    });
  }

  private async mcpEvaluate(functionCode: string): Promise<any> {
    return await invoke('mcp_playwright_invoke', {
      tool_name: 'browser_evaluate',
      tool_input: { function: functionCode }
    });
  }

  private async mcpClick(element: string, ref: string): Promise<void> {
    await invoke('mcp_playwright_invoke', {
      tool_name: 'browser_click',
      tool_input: { element, ref }
    });
  }
}

// Export convenience functions for compatibility
export const searchByTitleAndArtistMCP = async ({ artist, title }: { artist: string; title: string }): Promise<SearchResult[]> => {
  const provider = new MCPLyricsProvider();
  return provider.searchByTitleAndArtist({ artist, title });
};

export const getLyricsMCP = async (url: string): Promise<LyricsResult | null> => {
  const provider = new MCPLyricsProvider();
  return provider.getLyrics(url);
};

export const findByAnyParameterMCP = async (query: string): Promise<SearchResult[]> => {
  const provider = new MCPLyricsProvider();
  return provider.findByAnyParameter(query);
};