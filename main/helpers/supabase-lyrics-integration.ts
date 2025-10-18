import { supabase, Song, SongUpdate } from '../../lib/supabase';
import { lyricsAnalyticsService } from './lyrics-analytics-service';

interface LyricsUpdateResult {
  success: boolean;
  songId?: string;
  error?: string;
  metadata?: {
    artist: string;
    title: string;
    source: string;
    lyricsLength: number;
  };
}

interface BatchUpdateResult {
  total: number;
  successful: number;
  failed: number;
  results: LyricsUpdateResult[];
  duration: number;
}

/**
 * Service for integrating lyrics with Supabase database
 * Handles persistence of lyrics data and metadata
 */
export class SupabaseLyricsIntegration {
  
  /**
   * Update song lyrics in Supabase
   */
  async updateSongLyrics(
    songId: string, 
    lyrics: string, 
    source: string,
    metadata?: {
      artist?: string;
      title?: string;
      album?: string;
      year?: number;
      url?: string;
    }
  ): Promise<LyricsUpdateResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[SupabaseLyrics] Updating lyrics for song: ${songId}`);

      // Prepare update data
      const updateData: SongUpdate = {
        lyrics,
        updated_at: new Date().toISOString(),
        lyrics_length: lyrics.length,
        lyrics_preview: this.generateLyricsPreview(lyrics),
        provider: source,
        metadata: {
          lyrics_source: source,
          lyrics_updated_at: new Date().toISOString(),
          lyrics_fetch_url: metadata?.url,
          ...metadata
        }
      };

      // Update song in Supabase
      const { data, error } = await supabase
        .from('songs')
        .update(updateData)
        .eq('id', songId)
        .select()
        .single();

      if (error) {
        console.error('[SupabaseLyrics] Update failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const duration = Date.now() - startTime;
      
      // Track analytics
      lyricsAnalyticsService.trackLyricsRequest({
        url: metadata?.url || `song://${songId}`,
        artist: data.artist,
        title: data.title,
        source: `supabase-${source}`,
        duration,
        success: true,
        cacheHit: false,
        lyricsLength: lyrics.length
      });

      console.log(`[SupabaseLyrics] Successfully updated song ${songId} in ${duration}ms`);
      
      return {
        success: true,
        songId,
        metadata: {
          artist: data.artist,
          title: data.title,
          source,
          lyricsLength: lyrics.length
        }
      };

    } catch (error) {
      console.error('[SupabaseLyrics] Update failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get songs without lyrics from Supabase
   */
  async getSongsWithoutLyrics(limit: number = 100): Promise<Song[]> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .or('lyrics.is.null,lyrics.eq.')
        .limit(limit)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[SupabaseLyrics] Failed to get songs without lyrics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[SupabaseLyrics] Error getting songs without lyrics:', error);
      return [];
    }
  }

  /**
   * Get songs by search criteria
   */
  async searchSongs(query: string, limit: number = 50): Promise<Song[]> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .or(`title.ilike.%${query}%,artist.ilike.%${query}%,album.ilike.%${query}%`)
        .limit(limit)
        .order('title');

      if (error) {
        console.error('[SupabaseLyrics] Search failed:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[SupabaseLyrics] Error searching songs:', error);
      return [];
    }
  }

  /**
   * Get song by ID
   */
  async getSongById(songId: string): Promise<Song | null> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single();

      if (error) {
        console.error('[SupabaseLyrics] Failed to get song:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[SupabaseLyrics] Error getting song:', error);
      return null;
    }
  }

  /**
   * Batch update multiple songs with lyrics
   */
  async batchUpdateSongsLyrics(
    updates: Array<{
      songId: string;
      lyrics: string;
      source: string;
      metadata?: any;
    }>
  ): Promise<BatchUpdateResult> {
    const startTime = Date.now();
    const results: LyricsUpdateResult[] = [];
    let successful = 0;
    let failed = 0;

    console.log(`[SupabaseLyrics] Starting batch update of ${updates.length} songs`);

    for (const update of updates) {
      try {
        const result = await this.updateSongLyrics(
          update.songId,
          update.lyrics,
          update.source,
          update.metadata
        );

        results.push(result);
        
        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`[SupabaseLyrics] Batch update failed for song ${update.songId}:`, error);
        results.push({
          success: false,
          songId: update.songId,
          error: error.message
        });
        failed++;
      }
    }

    const duration = Date.now() - startTime;
    
    console.log(`[SupabaseLyrics] Batch update completed: ${successful} successful, ${failed} failed in ${duration}ms`);

    return {
      total: updates.length,
      successful,
      failed,
      results,
      duration
    };
  }

  /**
   * Get library statistics
   */
  async getLibraryStats(): Promise<{
    totalSongs: number;
    songsWithLyrics: number;
    songsWithoutLyrics: number;
    lyricsSourceBreakdown: Record<string, number>;
    averageLyricsLength: number;
    lastUpdated?: string;
  }> {
    try {
      // Get total songs count
      const { count: totalSongs } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true });

      // Get songs with lyrics count
      const { count: songsWithLyrics } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true })
        .not('lyrics', 'is', null)
        .neq('lyrics', '');

      // Get provider breakdown
      const { data: providerData } = await supabase
        .from('songs')
        .select('provider')
        .not('lyrics', 'is', null)
        .neq('lyrics', '');

      const lyricsSourceBreakdown: Record<string, number> = {};
      providerData?.forEach(song => {
        const provider = song.provider || 'unknown';
        lyricsSourceBreakdown[provider] = (lyricsSourceBreakdown[provider] || 0) + 1;
      });

      // Get average lyrics length
      const { data: lyricsData } = await supabase
        .from('songs')
        .select('lyrics_length')
        .not('lyrics', 'is', null)
        .neq('lyrics', '');

      const averageLyricsLength = lyricsData?.length > 0 
        ? lyricsData.reduce((sum, song) => sum + (song.lyrics_length || 0), 0) / lyricsData.length
        : 0;

      // Get last updated
      const { data: lastUpdatedData } = await supabase
        .from('songs')
        .select('updated_at')
        .not('lyrics', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1);

      return {
        totalSongs: totalSongs || 0,
        songsWithLyrics: songsWithLyrics || 0,
        songsWithoutLyrics: (totalSongs || 0) - (songsWithLyrics || 0),
        lyricsSourceBreakdown,
        averageLyricsLength: Math.round(averageLyricsLength),
        lastUpdated: lastUpdatedData?.[0]?.updated_at
      };

    } catch (error) {
      console.error('[SupabaseLyrics] Error getting library stats:', error);
      return {
        totalSongs: 0,
        songsWithLyrics: 0,
        songsWithoutLyrics: 0,
        lyricsSourceBreakdown: {},
        averageLyricsLength: 0
      };
    }
  }

  /**
   * Create a new song with lyrics
   */
  async createSongWithLyrics(
    artist: string,
    title: string,
    lyrics: string,
    source: string,
    metadata?: {
      album?: string;
      year?: number;
      genre?: string;
      url?: string;
    }
  ): Promise<LyricsUpdateResult> {
    try {
      console.log(`[SupabaseLyrics] Creating new song: ${artist} - ${title}`);

      const songData = {
        artist,
        title,
        lyrics,
        album: metadata?.album,
        year: metadata?.year,
        genre: metadata?.genre,
        url: metadata?.url,
        provider: source,
        lyrics_length: lyrics.length,
        lyrics_preview: this.generateLyricsPreview(lyrics),
        metadata: {
          lyrics_source: source,
          lyrics_created_at: new Date().toISOString(),
          ...metadata
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('songs')
        .insert(songData)
        .select()
        .single();

      if (error) {
        console.error('[SupabaseLyrics] Create failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log(`[SupabaseLyrics] Successfully created song ${data.id}`);
      
      return {
        success: true,
        songId: data.id,
        metadata: {
          artist,
          title,
          source,
          lyricsLength: lyrics.length
        }
      };

    } catch (error) {
      console.error('[SupabaseLyrics] Create failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete lyrics from a song (set to empty)
   */
  async deleteSongLyrics(songId: string): Promise<LyricsUpdateResult> {
    try {
      console.log(`[SupabaseLyrics] Deleting lyrics for song: ${songId}`);

      const { data, error } = await supabase
        .from('songs')
        .update({
          lyrics: '',
          lyrics_length: 0,
          lyrics_preview: null,
          provider: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', songId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        songId,
        metadata: {
          artist: data.artist,
          title: data.title,
          source: 'deleted',
          lyricsLength: 0
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search songs with full-text search
   */
  async fullTextSearchSongs(query: string, limit: number = 20): Promise<Song[]> {
    try {
      // Use PostgreSQL full-text search if available
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .textSearch('search_vector', query)
        .limit(limit);

      if (error) {
        // Fallback to ILIKE search
        return this.searchSongs(query, limit);
      }

      return data || [];
    } catch (error) {
      console.error('[SupabaseLyrics] Full-text search failed:', error);
      return this.searchSongs(query, limit);
    }
  }

  /**
   * Generate lyrics preview (first few lines)
   */
  private generateLyricsPreview(lyrics: string, maxLength: number = 200): string {
    if (!lyrics) return '';
    
    const lines = lyrics.split('\n').filter(line => line.trim());
    let preview = '';
    
    for (const line of lines) {
      if (preview.length + line.length > maxLength) break;
      preview += (preview ? '\n' : '') + line;
    }
    
    return preview + (lyrics.length > maxLength ? '...' : '');
  }

  /**
   * Update search terms for better searchability
   */
  async updateSearchTerms(songId: string): Promise<void> {
    try {
      const song = await this.getSongById(songId);
      if (!song) return;

      const searchTerms = [
        song.title,
        song.artist,
        song.album,
        song.genre,
        // Extract key words from lyrics
        ...(song.lyrics?.split(/\s+/).filter(word => word.length > 3).slice(0, 20) || [])
      ].filter(Boolean).join(' ').toLowerCase();

      await supabase
        .from('songs')
        .update({ 
          search_terms: searchTerms,
          updated_at: new Date().toISOString()
        })
        .eq('id', songId);

    } catch (error) {
      console.error('[SupabaseLyrics] Failed to update search terms:', error);
    }
  }
}

// Global instance
export const supabaseLyricsIntegration = new SupabaseLyricsIntegration();