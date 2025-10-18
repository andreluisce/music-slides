import { ipcMain } from 'electron';
import { FireCrawlLyricsProvider, getLyricsFireCrawl, searchByTitleAndArtistFireCrawl } from './lyrics-providers/firecrawl-lyrics-provider';
import { lyricsAnalyticsService } from './lyrics-analytics-service';
import { lyricsCacheService } from './lyrics-cache-service';
import { supabaseLyricsIntegration } from './supabase-lyrics-integration';
import { progressNotificationService } from './progress-notification-service';
import { Song } from '../../lib/supabase';

// Using Song type from Supabase schema
// interface Song already imported from '../../lib/supabase'

interface LyricsSearchResult {
  success: boolean;
  lyrics?: string;
  source?: string;
  metadata?: any;
  error?: string;
  fromCache?: boolean;
}

/**
 * Integration service between music library and lyrics providers
 * Automatically fetches and stores lyrics for songs in the library
 */
export class MusicLibraryIntegration {
  private provider: FireCrawlLyricsProvider;
  private isProcessing: boolean = false;
  private processingQueue: Song[] = [];

  constructor() {
    this.provider = new FireCrawlLyricsProvider(true);
    this.setupHandlers();
  }

  /**
   * Setup IPC handlers for music library integration
   */
  private setupHandlers() {
    // Get lyrics for a specific song
    ipcMain.handle('music-library:get-lyrics', async (event, song: Song) => {
      return this.getLyricsForSong(song);
    });

    // Batch process multiple songs
    ipcMain.handle('music-library:batch-get-lyrics', async (event, songs: Song[]) => {
      return this.batchGetLyrics(songs);
    });

    // Auto-fill lyrics for songs without lyrics
    ipcMain.handle('music-library:auto-fill-lyrics', async (event, songs: Song[]) => {
      return this.autoFillLyrics(songs);
    });

    // Search and replace lyrics for a song
    ipcMain.handle('music-library:search-and-replace-lyrics', async (event, song: Song) => {
      return this.searchAndReplaceLyrics(song);
    });

    // Get analytics for lyrics processing
    ipcMain.handle('music-library:get-lyrics-stats', async () => {
      return this.getLyricsStats();
    });

    // Clear lyrics cache
    ipcMain.handle('music-library:clear-cache', async () => {
      await lyricsCacheService.clearCache();
      return { success: true, message: 'Cache cleared successfully' };
    });
  }

  /**
   * Get lyrics for a single song and persist to Supabase
   */
  async getLyricsForSong(song: Song): Promise<LyricsSearchResult> {
    try {
      console.log(`[MusicLibraryIntegration] Getting lyrics for: ${song.artist} - ${song.title}`);

      // First try to search for the song
      const searchResults = await this.provider.searchByTitleAndArtist({
        artist: song.artist,
        title: song.title
      });

      if (searchResults.length === 0) {
        return {
          success: false,
          error: 'No search results found'
        };
      }

      // Try to get lyrics from the first (best) result
      const bestResult = searchResults[0];
      const lyricsResult = await this.provider.getLyrics(bestResult.url);

      if (!lyricsResult) {
        return {
          success: false,
          error: 'Failed to extract lyrics from page'
        };
      }

      // Persist to Supabase if song has ID
      if (song.id) {
        const updateResult = await supabaseLyricsIntegration.updateSongLyrics(
          song.id,
          lyricsResult.lyrics,
          lyricsResult.source,
          {
            artist: lyricsResult.artist,
            title: lyricsResult.title,
            album: lyricsResult.metadata?.album,
            year: lyricsResult.metadata?.year ? parseInt(lyricsResult.metadata.year) : undefined,
            url: bestResult.url
          }
        );

        if (!updateResult.success) {
          console.warn('[MusicLibraryIntegration] Failed to persist to Supabase:', updateResult.error);
        }
      }

      return {
        success: true,
        lyrics: lyricsResult.lyrics,
        source: lyricsResult.source,
        metadata: {
          artist: lyricsResult.artist,
          title: lyricsResult.title,
          album: lyricsResult.metadata?.album,
          year: lyricsResult.metadata?.year,
          url: bestResult.url,
          confidence: bestResult.confidence
        }
      };

    } catch (error) {
      console.error('[MusicLibraryIntegration] Failed to get lyrics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process multiple songs in batch with progress notifications
   */
  async batchGetLyrics(songs: Song[]): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: Array<{ song: Song; result: LyricsSearchResult }>;
  }> {
    const progressId = `batch-lyrics-${Date.now()}`;
    const startTime = Date.now();
    
    console.log(`[MusicLibraryIntegration] Batch processing ${songs.length} songs`);
    
    // Start progress tracking
    progressNotificationService.startProgress(
      progressId,
      'Batch Lyrics Processing',
      `Processing ${songs.length} songs...`,
      songs.length
    );
    
    const results: Array<{ song: Song; result: LyricsSearchResult }> = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      
      try {
        // Update progress with current song
        progressNotificationService.updateProgress(progressId, {
          message: `Processing: ${song.artist} - ${song.title}`,
          details: {
            current: `${song.artist} - ${song.title}`,
            processed: i,
            successful,
            failed
          }
        });

        const result = await this.getLyricsForSong(song);
        results.push({ song, result });
        
        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        // Update progress after processing
        progressNotificationService.updateProgress(progressId, {
          details: {
            processed: i + 1,
            successful,
            failed
          }
        });

        // Add small delay to avoid overwhelming services
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`[MusicLibraryIntegration] Failed to process song: ${song.artist} - ${song.title}`, error);
        results.push({
          song,
          result: {
            success: false,
            error: error.message
          }
        });
        failed++;

        // Update progress with error
        progressNotificationService.updateProgress(progressId, {
          details: {
            processed: i + 1,
            successful,
            failed
          }
        });
      }
    }

    const duration = Date.now() - startTime;
    
    // Complete progress
    progressNotificationService.completeProgress(
      progressId,
      `Batch processing completed: ${successful} successful, ${failed} failed`,
      { successful, failed, duration }
    );

    console.log(`[MusicLibraryIntegration] Batch completed: ${successful} successful, ${failed} failed in ${duration}ms`);
    
    return {
      processed: songs.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Auto-fill lyrics for songs that don't have them with progress notifications
   */
  async autoFillLyrics(songs?: Song[]): Promise<{
    processed: number;
    filled: number;
    skipped: number;
    failed: number;
  }> {
    const progressId = `auto-fill-lyrics-${Date.now()}`;
    const startTime = Date.now();
    
    // If no songs provided, get songs without lyrics from Supabase
    if (!songs) {
      console.log('[MusicLibraryIntegration] Fetching songs without lyrics from Supabase...');
      songs = await supabaseLyricsIntegration.getSongsWithoutLyrics(500); // Limit to 500 for performance
    }
    
    console.log(`[MusicLibraryIntegration] Auto-filling lyrics for ${songs.length} songs`);
    
    // Filter songs that don't have lyrics
    const songsWithoutLyrics = songs.filter(song => 
      !song.lyrics || song.lyrics.trim().length === 0
    );

    console.log(`[MusicLibraryIntegration] Found ${songsWithoutLyrics.length} songs without lyrics`);

    // Start progress tracking
    progressNotificationService.startProgress(
      progressId,
      'Auto-Fill Lyrics',
      `Processing ${songsWithoutLyrics.length} songs without lyrics...`,
      songsWithoutLyrics.length
    );

    let filled = 0;
    let failed = 0;

    for (let i = 0; i < songsWithoutLyrics.length; i++) {
      const song = songsWithoutLyrics[i];
      
      try {
        // Update progress
        progressNotificationService.updateProgress(progressId, {
          message: `Processing: ${song.artist} - ${song.title}`,
          details: {
            current: `${song.artist} - ${song.title}`,
            processed: i,
            successful: filled,
            failed
          }
        });

        const result = await this.getLyricsForSong(song);
        
        if (result.success) {
          filled++;
          console.log(`[MusicLibraryIntegration] Updated lyrics for: ${song.artist} - ${song.title}`);
        } else {
          failed++;
        }

        // Update progress after processing
        progressNotificationService.updateProgress(progressId, {
          details: {
            processed: i + 1,
            successful: filled,
            failed
          }
        });

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`[MusicLibraryIntegration] Failed to auto-fill lyrics for: ${song.artist} - ${song.title}`, error);
        failed++;
        
        // Update progress with error
        progressNotificationService.updateProgress(progressId, {
          details: {
            processed: i + 1,
            successful: filled,
            failed
          }
        });
      }
    }

    const skipped = songs.length - songsWithoutLyrics.length;
    const duration = Date.now() - startTime;
    
    // Complete progress
    progressNotificationService.completeProgress(
      progressId,
      `Auto-fill completed: ${filled} filled, ${skipped} skipped, ${failed} failed`,
      { successful: filled, failed, duration }
    );
    
    console.log(`[MusicLibraryIntegration] Auto-fill completed: ${filled} filled, ${skipped} skipped, ${failed} failed in ${duration}ms`);
    
    return {
      processed: songs.length,
      filled,
      skipped,
      failed
    };
  }

  /**
   * Search for new lyrics and replace existing ones
   */
  async searchAndReplaceLyrics(song: Song): Promise<LyricsSearchResult> {
    try {
      console.log(`[MusicLibraryIntegration] Searching new lyrics for: ${song.artist} - ${song.title}`);

      // Clear cache for this song to force fresh search
      const searchKey = `${song.artist.toLowerCase().trim()}-${song.title.toLowerCase().trim()}-firecrawl`;
      
      const result = await this.getLyricsForSong(song);
      
      if (result.success) {
        await this.updateSongLyrics(song, {
          lyrics: result.lyrics!,
          lyrics_source: result.source!,
          lyrics_updated_at: new Date().toISOString(),
          has_lyrics: true
        });
      }

      return result;

    } catch (error) {
      console.error('[MusicLibraryIntegration] Failed to search and replace lyrics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive statistics about lyrics processing
   */
  async getLyricsStats(): Promise<{
    analytics: any;
    cache: any;
    library: any;
  }> {
    try {
      const analytics = lyricsAnalyticsService.getStats();
      const performanceMetrics = lyricsAnalyticsService.getPerformanceMetrics();
      const topSearched = lyricsAnalyticsService.getTopSearched();
      const cache = lyricsCacheService.getStats();

      // Get library stats from Supabase
      const libraryStats = await supabaseLyricsIntegration.getLibraryStats();

      return {
        analytics: {
          ...analytics,
          performanceMetrics,
          topSearched
        },
        cache,
        library: libraryStats
      };

    } catch (error) {
      console.error('[MusicLibraryIntegration] Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Start auto-processing queue
   */
  startAutoProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processQueue();
  }

  /**
   * Stop auto-processing queue
   */
  stopAutoProcessing(): void {
    this.isProcessing = false;
  }

  /**
   * Add songs to processing queue
   */
  addToQueue(songs: Song[]): void {
    this.processingQueue.push(...songs);
    console.log(`[MusicLibraryIntegration] Added ${songs.length} songs to queue. Queue size: ${this.processingQueue.length}`);
  }

  /**
   * Process songs in queue
   */
  private async processQueue(): Promise<void> {
    while (this.isProcessing && this.processingQueue.length > 0) {
      const song = this.processingQueue.shift()!;
      
      try {
        await this.getLyricsForSong(song);
        // Add delay between queue items
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('[MusicLibraryIntegration] Queue processing error:', error);
      }
    }
    
    this.isProcessing = false;
  }
}

// Global integration service instance
export const musicLibraryIntegration = new MusicLibraryIntegration();