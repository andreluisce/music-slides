import * as fs from 'fs-extra';
import * as path from 'path';
import { app } from 'electron';

interface CachedSearchResult {
  artist: string;
  title: string;
  url: string;
  confidence?: number;
  timestamp: number;
  source: 'firecrawl' | 'playwright';
}

interface CachedLyrics {
  artist: string;
  title: string;
  lyrics: string;
  source: string;
  metadata?: {
    album?: string;
    year?: string;
    duration?: string;
  };
  timestamp: number;
  url: string;
}

interface CacheStats {
  totalSearches: number;
  cacheHits: number;
  cacheMisses: number;
  totalLyricsRequests: number;
  lyricsHits: number;
  lyricsMisses: number;
  lastCleanup: number;
}

/**
 * Cache service for lyrics search results and lyrics content
 * Implements intelligent caching with TTL and size limits
 */
export class LyricsCacheService {
  private readonly cacheDir: string;
  private readonly searchCacheFile: string;
  private readonly lyricsCacheFile: string;
  private readonly statsFile: string;
  
  private searchCache: Map<string, CachedSearchResult[]> = new Map();
  private lyricsCache: Map<string, CachedLyrics> = new Map();
  private stats: CacheStats;
  
  // Cache configuration
  private readonly SEARCH_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly LYRICS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_SEARCH_ENTRIES = 1000;
  private readonly MAX_LYRICS_ENTRIES = 500;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.cacheDir = path.join(app.getPath('userData'), 'lyrics-cache');
    this.searchCacheFile = path.join(this.cacheDir, 'search-cache.json');
    this.lyricsCacheFile = path.join(this.cacheDir, 'lyrics-cache.json');
    this.statsFile = path.join(this.cacheDir, 'cache-stats.json');
    
    this.stats = {
      totalSearches: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalLyricsRequests: 0,
      lyricsHits: 0,
      lyricsMisses: 0,
      lastCleanup: Date.now()
    };

    this.initialize();
  }

  /**
   * Initialize cache service
   */
  private async initialize() {
    try {
      await fs.ensureDir(this.cacheDir);
      await this.loadCache();
      
      // Schedule periodic cleanup
      setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
      
      console.log('[LyricsCache] Service initialized');
    } catch (error) {
      console.error('[LyricsCache] Failed to initialize:', error);
    }
  }

  /**
   * Generate cache key for search
   */
  private getSearchKey(artist: string, title: string, source: string): string {
    return `${artist.toLowerCase().trim()}-${title.toLowerCase().trim()}-${source}`;
  }

  /**
   * Generate cache key for lyrics
   */
  private getLyricsKey(url: string): string {
    return url.toLowerCase().trim();
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    artist: string, 
    title: string, 
    results: CachedSearchResult[], 
    source: 'firecrawl' | 'playwright'
  ): Promise<void> {
    try {
      const key = this.getSearchKey(artist, title, source);
      const cachedResults = results.map(result => ({
        ...result,
        timestamp: Date.now(),
        source
      }));

      this.searchCache.set(key, cachedResults);
      await this.saveSearchCache();
      
      console.log(`[LyricsCache] Cached search results: ${key} (${results.length} results)`);
    } catch (error) {
      console.error('[LyricsCache] Failed to cache search results:', error);
    }
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(
    artist: string, 
    title: string, 
    source: 'firecrawl' | 'playwright'
  ): Promise<CachedSearchResult[] | null> {
    try {
      this.stats.totalSearches++;
      
      const key = this.getSearchKey(artist, title, source);
      const cached = this.searchCache.get(key);
      
      if (!cached) {
        this.stats.cacheMisses++;
        await this.saveStats();
        return null;
      }

      // Check if cache is still valid
      const isValid = Date.now() - cached[0].timestamp < this.SEARCH_TTL;
      if (!isValid) {
        this.searchCache.delete(key);
        this.stats.cacheMisses++;
        await this.saveStats();
        return null;
      }

      this.stats.cacheHits++;
      await this.saveStats();
      
      console.log(`[LyricsCache] Cache hit for search: ${key}`);
      return cached;
    } catch (error) {
      console.error('[LyricsCache] Failed to get cached search results:', error);
      return null;
    }
  }

  /**
   * Cache lyrics content
   */
  async cacheLyrics(url: string, lyrics: CachedLyrics): Promise<void> {
    try {
      const key = this.getLyricsKey(url);
      const cachedLyrics = {
        ...lyrics,
        timestamp: Date.now(),
        url
      };

      this.lyricsCache.set(key, cachedLyrics);
      await this.saveLyricsCache();
      
      console.log(`[LyricsCache] Cached lyrics: ${lyrics.artist} - ${lyrics.title}`);
    } catch (error) {
      console.error('[LyricsCache] Failed to cache lyrics:', error);
    }
  }

  /**
   * Get cached lyrics
   */
  async getCachedLyrics(url: string): Promise<CachedLyrics | null> {
    try {
      this.stats.totalLyricsRequests++;
      
      const key = this.getLyricsKey(url);
      const cached = this.lyricsCache.get(key);
      
      if (!cached) {
        this.stats.lyricsMisses++;
        await this.saveStats();
        return null;
      }

      // Check if cache is still valid
      const isValid = Date.now() - cached.timestamp < this.LYRICS_TTL;
      if (!isValid) {
        this.lyricsCache.delete(key);
        this.stats.lyricsMisses++;
        await this.saveStats();
        return null;
      }

      this.stats.lyricsHits++;
      await this.saveStats();
      
      console.log(`[LyricsCache] Cache hit for lyrics: ${cached.artist} - ${cached.title}`);
      return cached;
    } catch (error) {
      console.error('[LyricsCache] Failed to get cached lyrics:', error);
      return null;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & {
    searchCacheSize: number;
    lyricsCacheSize: number;
    searchHitRate: number;
    lyricsHitRate: number;
  } {
    const searchHitRate = this.stats.totalSearches > 0 
      ? (this.stats.cacheHits / this.stats.totalSearches) * 100 
      : 0;
    
    const lyricsHitRate = this.stats.totalLyricsRequests > 0 
      ? (this.stats.lyricsHits / this.stats.totalLyricsRequests) * 100 
      : 0;

    return {
      ...this.stats,
      searchCacheSize: this.searchCache.size,
      lyricsCacheSize: this.lyricsCache.size,
      searchHitRate: Math.round(searchHitRate * 100) / 100,
      lyricsHitRate: Math.round(lyricsHitRate * 100) / 100
    };
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    try {
      this.searchCache.clear();
      this.lyricsCache.clear();
      
      await Promise.all([
        fs.remove(this.searchCacheFile),
        fs.remove(this.lyricsCacheFile)
      ]);
      
      console.log('[LyricsCache] Cache cleared');
    } catch (error) {
      console.error('[LyricsCache] Failed to clear cache:', error);
    }
  }

  /**
   * Cleanup expired entries and enforce size limits
   */
  private async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      let cleanedSearchEntries = 0;
      let cleanedLyricsEntries = 0;

      // Cleanup expired search cache
      for (const [key, results] of this.searchCache) {
        if (now - results[0].timestamp > this.SEARCH_TTL) {
          this.searchCache.delete(key);
          cleanedSearchEntries++;
        }
      }

      // Cleanup expired lyrics cache
      for (const [key, lyrics] of this.lyricsCache) {
        if (now - lyrics.timestamp > this.LYRICS_TTL) {
          this.lyricsCache.delete(key);
          cleanedLyricsEntries++;
        }
      }

      // Enforce size limits (remove oldest entries)
      if (this.searchCache.size > this.MAX_SEARCH_ENTRIES) {
        const entries = Array.from(this.searchCache.entries())
          .sort((a, b) => a[1][0].timestamp - b[1][0].timestamp);
        
        const toRemove = entries.slice(0, this.searchCache.size - this.MAX_SEARCH_ENTRIES);
        toRemove.forEach(([key]) => this.searchCache.delete(key));
        cleanedSearchEntries += toRemove.length;
      }

      if (this.lyricsCache.size > this.MAX_LYRICS_ENTRIES) {
        const entries = Array.from(this.lyricsCache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const toRemove = entries.slice(0, this.lyricsCache.size - this.MAX_LYRICS_ENTRIES);
        toRemove.forEach(([key]) => this.lyricsCache.delete(key));
        cleanedLyricsEntries += toRemove.length;
      }

      this.stats.lastCleanup = now;
      await this.saveCache();
      
      if (cleanedSearchEntries > 0 || cleanedLyricsEntries > 0) {
        console.log(`[LyricsCache] Cleanup completed: ${cleanedSearchEntries} search, ${cleanedLyricsEntries} lyrics entries removed`);
      }
    } catch (error) {
      console.error('[LyricsCache] Cleanup failed:', error);
    }
  }

  /**
   * Save cache to disk
   */
  private async saveCache(): Promise<void> {
    await Promise.all([
      this.saveSearchCache(),
      this.saveLyricsCache(),
      this.saveStats()
    ]);
  }

  /**
   * Load cache from disk
   */
  private async loadCache(): Promise<void> {
    try {
      // Load search cache
      if (await fs.pathExists(this.searchCacheFile)) {
        const searchData = await fs.readJSON(this.searchCacheFile);
        this.searchCache = new Map(Object.entries(searchData));
      }

      // Load lyrics cache
      if (await fs.pathExists(this.lyricsCacheFile)) {
        const lyricsData = await fs.readJSON(this.lyricsCacheFile);
        this.lyricsCache = new Map(Object.entries(lyricsData));
      }

      // Load stats
      if (await fs.pathExists(this.statsFile)) {
        this.stats = await fs.readJSON(this.statsFile);
      }

      console.log(`[LyricsCache] Loaded cache: ${this.searchCache.size} search, ${this.lyricsCache.size} lyrics entries`);
    } catch (error) {
      console.error('[LyricsCache] Failed to load cache:', error);
    }
  }

  private async saveSearchCache(): Promise<void> {
    try {
      const data = Object.fromEntries(this.searchCache);
      await fs.writeJSON(this.searchCacheFile, data, { spaces: 2 });
    } catch (error) {
      console.error('[LyricsCache] Failed to save search cache:', error);
    }
  }

  private async saveLyricsCache(): Promise<void> {
    try {
      const data = Object.fromEntries(this.lyricsCache);
      await fs.writeJSON(this.lyricsCacheFile, data, { spaces: 2 });
    } catch (error) {
      console.error('[LyricsCache] Failed to save lyrics cache:', error);
    }
  }

  private async saveStats(): Promise<void> {
    try {
      await fs.writeJSON(this.statsFile, this.stats, { spaces: 2 });
    } catch (error) {
      console.error('[LyricsCache] Failed to save stats:', error);
    }
  }
}

// Global cache service instance
export const lyricsCacheService = new LyricsCacheService();