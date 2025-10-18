import * as fs from 'fs-extra';
import * as path from 'path';
import { app } from 'electron';

interface SearchEvent {
  timestamp: number;
  artist: string;
  title: string;
  source: 'firecrawl' | 'playwright';
  resultsCount: number;
  duration: number; // milliseconds
  success: boolean;
  error?: string;
  cacheHit: boolean;
}

interface LyricsEvent {
  timestamp: number;
  url: string;
  artist: string;
  title: string;
  source: string;
  duration: number; // milliseconds
  success: boolean;
  error?: string;
  cacheHit: boolean;
  lyricsLength?: number;
}

interface UsageStats {
  totalSearches: number;
  totalLyricsRequests: number;
  successfulSearches: number;
  successfulLyricsRequests: number;
  averageSearchDuration: number;
  averageLyricsDuration: number;
  mostSearchedArtists: Record<string, number>;
  mostSearchedSongs: Record<string, number>;
  sourcesUsage: Record<string, number>;
  errorsByType: Record<string, number>;
  dailyUsage: Record<string, number>;
  cacheEfficiency: {
    searchHitRate: number;
    lyricsHitRate: number;
  };
}

interface PerformanceMetrics {
  searchDurations: number[];
  lyricsDurations: number[];
  errorRates: {
    search: number;
    lyrics: number;
  };
  sourcePerformance: Record<string, {
    averageDuration: number;
    successRate: number;
    totalRequests: number;
  }>;
}

/**
 * Analytics service for tracking lyrics search usage and performance
 */
export class LyricsAnalyticsService {
  private readonly analyticsDir: string;
  private readonly eventsFile: string;
  private readonly statsFile: string;
  
  private searchEvents: SearchEvent[] = [];
  private lyricsEvents: LyricsEvent[] = [];
  private stats: UsageStats;
  
  // Configuration
  private readonly MAX_EVENTS = 10000; // Keep last 10k events
  private readonly SAVE_INTERVAL = 30000; // Save every 30 seconds
  private readonly STATS_UPDATE_INTERVAL = 60000; // Update stats every minute

  constructor() {
    this.analyticsDir = path.join(app.getPath('userData'), 'lyrics-analytics');
    this.eventsFile = path.join(this.analyticsDir, 'events.json');
    this.statsFile = path.join(this.analyticsDir, 'stats.json');
    
    this.stats = this.getEmptyStats();
    this.initialize();
  }

  /**
   * Initialize analytics service
   */
  private async initialize() {
    try {
      await fs.ensureDir(this.analyticsDir);
      await this.loadData();
      
      // Schedule periodic saves and stats updates
      setInterval(() => this.saveData(), this.SAVE_INTERVAL);
      setInterval(() => this.updateStats(), this.STATS_UPDATE_INTERVAL);
      
      console.log('[LyricsAnalytics] Service initialized');
    } catch (error) {
      console.error('[LyricsAnalytics] Failed to initialize:', error);
    }
  }

  /**
   * Track a search event
   */
  trackSearch({
    artist,
    title,
    source,
    resultsCount,
    duration,
    success,
    error,
    cacheHit
  }: Omit<SearchEvent, 'timestamp'>): void {
    const event: SearchEvent = {
      timestamp: Date.now(),
      artist: artist.trim(),
      title: title.trim(),
      source,
      resultsCount,
      duration,
      success,
      error,
      cacheHit
    };

    this.searchEvents.push(event);
    this.trimEvents();
    
    console.log(`[LyricsAnalytics] Search tracked: ${artist} - ${title} (${source}, ${duration}ms, ${success ? 'success' : 'failed'})`);
  }

  /**
   * Track a lyrics request event
   */
  trackLyricsRequest({
    url,
    artist,
    title,
    source,
    duration,
    success,
    error,
    cacheHit,
    lyricsLength
  }: Omit<LyricsEvent, 'timestamp'>): void {
    const event: LyricsEvent = {
      timestamp: Date.now(),
      url,
      artist: artist.trim(),
      title: title.trim(),
      source,
      duration,
      success,
      error,
      cacheHit,
      lyricsLength
    };

    this.lyricsEvents.push(event);
    this.trimEvents();
    
    console.log(`[LyricsAnalytics] Lyrics tracked: ${artist} - ${title} (${source}, ${duration}ms, ${success ? 'success' : 'failed'})`);
  }

  /**
   * Get current usage statistics
   */
  getStats(): UsageStats {
    return { ...this.stats };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const searchDurations = this.searchEvents
      .filter(e => e.success)
      .map(e => e.duration);
    
    const lyricsDurations = this.lyricsEvents
      .filter(e => e.success)
      .map(e => e.duration);

    const sourcePerformance: Record<string, any> = {};
    
    // Calculate performance by source
    for (const source of ['firecrawl', 'playwright']) {
      const searchEvents = this.searchEvents.filter(e => e.source === source);
      const lyricsEvents = this.lyricsEvents.filter(e => e.source.includes(source));
      
      const allEvents = [...searchEvents, ...lyricsEvents];
      const successfulEvents = allEvents.filter(e => e.success);
      
      sourcePerformance[source] = {
        averageDuration: successfulEvents.length > 0 
          ? successfulEvents.reduce((sum, e) => sum + e.duration, 0) / successfulEvents.length 
          : 0,
        successRate: allEvents.length > 0 
          ? (successfulEvents.length / allEvents.length) * 100 
          : 0,
        totalRequests: allEvents.length
      };
    }

    return {
      searchDurations,
      lyricsDurations,
      errorRates: {
        search: this.searchEvents.length > 0 
          ? (this.searchEvents.filter(e => !e.success).length / this.searchEvents.length) * 100 
          : 0,
        lyrics: this.lyricsEvents.length > 0 
          ? (this.lyricsEvents.filter(e => !e.success).length / this.lyricsEvents.length) * 100 
          : 0
      },
      sourcePerformance
    };
  }

  /**
   * Get events for a specific time range
   */
  getEventsInRange(startTime: number, endTime: number): {
    searchEvents: SearchEvent[];
    lyricsEvents: LyricsEvent[];
  } {
    return {
      searchEvents: this.searchEvents.filter(e => 
        e.timestamp >= startTime && e.timestamp <= endTime
      ),
      lyricsEvents: this.lyricsEvents.filter(e => 
        e.timestamp >= startTime && e.timestamp <= endTime
      )
    };
  }

  /**
   * Get top searched items
   */
  getTopSearched(limit: number = 10): {
    artists: Array<{ name: string; count: number }>;
    songs: Array<{ name: string; count: number }>;
  } {
    const artistCounts: Record<string, number> = {};
    const songCounts: Record<string, number> = {};

    this.searchEvents.forEach(event => {
      const artist = event.artist.toLowerCase();
      const song = `${event.artist} - ${event.title}`.toLowerCase();
      
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
      songCounts[song] = (songCounts[song] || 0) + 1;
    });

    const artists = Object.entries(artistCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    const songs = Object.entries(songCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { artists, songs };
  }

  /**
   * Export analytics data
   */
  async exportData(): Promise<{
    stats: UsageStats;
    performanceMetrics: PerformanceMetrics;
    topSearched: ReturnType<typeof this.getTopSearched>;
    recentEvents: {
      searchEvents: SearchEvent[];
      lyricsEvents: LyricsEvent[];
    };
  }> {
    const now = Date.now();
    const last30Days = now - (30 * 24 * 60 * 60 * 1000);
    
    return {
      stats: this.getStats(),
      performanceMetrics: this.getPerformanceMetrics(),
      topSearched: this.getTopSearched(),
      recentEvents: this.getEventsInRange(last30Days, now)
    };
  }

  /**
   * Clear all analytics data
   */
  async clearData(): Promise<void> {
    try {
      this.searchEvents = [];
      this.lyricsEvents = [];
      this.stats = this.getEmptyStats();
      
      await Promise.all([
        fs.remove(this.eventsFile),
        fs.remove(this.statsFile)
      ]);
      
      console.log('[LyricsAnalytics] Data cleared');
    } catch (error) {
      console.error('[LyricsAnalytics] Failed to clear data:', error);
    }
  }

  /**
   * Update aggregated statistics
   */
  private updateStats(): void {
    const allSearchEvents = this.searchEvents;
    const allLyricsEvents = this.lyricsEvents;
    
    this.stats = {
      totalSearches: allSearchEvents.length,
      totalLyricsRequests: allLyricsEvents.length,
      successfulSearches: allSearchEvents.filter(e => e.success).length,
      successfulLyricsRequests: allLyricsEvents.filter(e => e.success).length,
      
      averageSearchDuration: allSearchEvents.length > 0 
        ? allSearchEvents.reduce((sum, e) => sum + e.duration, 0) / allSearchEvents.length 
        : 0,
      
      averageLyricsDuration: allLyricsEvents.length > 0 
        ? allLyricsEvents.reduce((sum, e) => sum + e.duration, 0) / allLyricsEvents.length 
        : 0,
      
      mostSearchedArtists: this.getMostSearchedArtists(),
      mostSearchedSongs: this.getMostSearchedSongs(),
      sourcesUsage: this.getSourcesUsage(),
      errorsByType: this.getErrorsByType(),
      dailyUsage: this.getDailyUsage(),
      
      cacheEfficiency: {
        searchHitRate: allSearchEvents.length > 0 
          ? (allSearchEvents.filter(e => e.cacheHit).length / allSearchEvents.length) * 100 
          : 0,
        lyricsHitRate: allLyricsEvents.length > 0 
          ? (allLyricsEvents.filter(e => e.cacheHit).length / allLyricsEvents.length) * 100 
          : 0
      }
    };
  }

  private getMostSearchedArtists(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.searchEvents.forEach(event => {
      const artist = event.artist.toLowerCase();
      counts[artist] = (counts[artist] || 0) + 1;
    });
    return counts;
  }

  private getMostSearchedSongs(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.searchEvents.forEach(event => {
      const song = `${event.artist} - ${event.title}`.toLowerCase();
      counts[song] = (counts[song] || 0) + 1;
    });
    return counts;
  }

  private getSourcesUsage(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    this.searchEvents.forEach(event => {
      counts[event.source] = (counts[event.source] || 0) + 1;
    });
    
    this.lyricsEvents.forEach(event => {
      counts[event.source] = (counts[event.source] || 0) + 1;
    });
    
    return counts;
  }

  private getErrorsByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    [...this.searchEvents, ...this.lyricsEvents]
      .filter(e => !e.success && e.error)
      .forEach(event => {
        const errorType = event.error!.split(':')[0]; // Get error type before colon
        counts[errorType] = (counts[errorType] || 0) + 1;
      });
    
    return counts;
  }

  private getDailyUsage(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    [...this.searchEvents, ...this.lyricsEvents].forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });
    
    return counts;
  }

  private getEmptyStats(): UsageStats {
    return {
      totalSearches: 0,
      totalLyricsRequests: 0,
      successfulSearches: 0,
      successfulLyricsRequests: 0,
      averageSearchDuration: 0,
      averageLyricsDuration: 0,
      mostSearchedArtists: {},
      mostSearchedSongs: {},
      sourcesUsage: {},
      errorsByType: {},
      dailyUsage: {},
      cacheEfficiency: {
        searchHitRate: 0,
        lyricsHitRate: 0
      }
    };
  }

  private trimEvents(): void {
    if (this.searchEvents.length > this.MAX_EVENTS) {
      this.searchEvents = this.searchEvents.slice(-this.MAX_EVENTS);
    }
    
    if (this.lyricsEvents.length > this.MAX_EVENTS) {
      this.lyricsEvents = this.lyricsEvents.slice(-this.MAX_EVENTS);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        fs.writeJSON(this.eventsFile, {
          searchEvents: this.searchEvents,
          lyricsEvents: this.lyricsEvents
        }, { spaces: 2 }),
        fs.writeJSON(this.statsFile, this.stats, { spaces: 2 })
      ]);
    } catch (error) {
      console.error('[LyricsAnalytics] Failed to save data:', error);
    }
  }

  private async loadData(): Promise<void> {
    try {
      // Load events
      if (await fs.pathExists(this.eventsFile)) {
        const eventsData = await fs.readJSON(this.eventsFile);
        this.searchEvents = eventsData.searchEvents || [];
        this.lyricsEvents = eventsData.lyricsEvents || [];
      }

      // Load stats
      if (await fs.pathExists(this.statsFile)) {
        this.stats = await fs.readJSON(this.statsFile);
      } else {
        this.updateStats(); // Generate initial stats
      }

      console.log(`[LyricsAnalytics] Loaded data: ${this.searchEvents.length} search, ${this.lyricsEvents.length} lyrics events`);
    } catch (error) {
      console.error('[LyricsAnalytics] Failed to load data:', error);
    }
  }
}

// Global analytics service instance
export const lyricsAnalyticsService = new LyricsAnalyticsService();