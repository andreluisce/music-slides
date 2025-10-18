/**
 * Sync Service - Bidirectional synchronization between Local and Supabase
 *
 * Features:
 * - Unified song list (no duplicates shown to user)
 * - Automatic bidirectional sync
 * - Conflict detection and resolution
 * - Sync status tracking
 */

import { readSong, saveSong, getAllSongsGroupedByArtist, songExists, createSongFileContent, parseSongFileContent } from './file-system';
import { uploadSongToSupabase, downloadSongFromSupabase } from './supabase-sync';
import { createClient } from '@supabase/supabase-js';
import { Tables } from '../../lib/supabase';

export type SyncStatus = 'synced' | 'local-only' | 'cloud-only' | 'syncing' | 'conflict' | 'error';

interface SongMetadata {
  updatedAt?: string;
  createdAt?: string;
  [key: string]: any; // Allow other properties
}

export interface UnifiedSong {
  artist: string;
  title: string;
  syncStatus: SyncStatus;
  localPath?: string;
  cloudId?: string;
  localUpdatedAt?: string;
  cloudUpdatedAt?: string;
  metadata?: SongMetadata;
  slideCount?: number;
}

/**
 * Get unified song list with sync status
 */
export async function getUnifiedSongList(): Promise<UnifiedSong[]> {
  const songMap = new Map<string, UnifiedSong>();

  // Helper to create a unique key for each song
  const getSongKey = (artist: string, title: string) =>
    `${artist.toLowerCase().trim()}|||${title.toLowerCase().trim()}`;

  // 1. Load local songs
  console.log('📁 Loading local songs...');
  try {
    const localGroups = await getAllSongsGroupedByArtist();
    console.log(`📁 Found ${localGroups.length} local artist folders`);

    for (const group of localGroups) {
      console.log(`   📁 ${group.artist}: ${group.songs.length} songs`);
      for (const song of group.songs) {
        const key = getSongKey(group.artist, song.title);
        const filePath = `${group.normalizedArtist}/${song.normalizedTitle}.json`;

        // Read song to get metadata
        let metadata: SongMetadata = {};
        let localUpdatedAt = '';
        let slideCount = 0;
        try {
          const songData = await readSong(group.artist, song.title);
          metadata = songData.metadata || {};
          localUpdatedAt = metadata.updatedAt || metadata.createdAt || '';
          // Get slide count from slides array if it exists
          if (songData.slides && Array.isArray(songData.slides)) {
            slideCount = songData.slides.length;
          }
        } catch (e) {
          console.warn(`⚠️  Could not read metadata for ${group.artist} - ${song.title}`);
        }

        songMap.set(key, {
          artist: group.artist,
          title: song.title,
          syncStatus: 'local-only',
          localPath: filePath,
          localUpdatedAt,
          metadata,
          slideCount,
        });
      }
    }
  } catch (error) {
    console.error('❌ Error loading local songs:', error as Error);
  }

  // 2. Load Supabase songs
  console.log('☁️  Loading Supabase songs...');
  try {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️  Supabase not configured - skipping cloud sync');
      return Array.from(songMap.values());
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cloudSongs, error } = await supabase
      .from('songs')
      .select('id, artist, title, updated_at, metadata');

    if (error) {
      console.error('❌ Error loading Supabase songs:', error as Error);
      return Array.from(songMap.values());
    }

    console.log(`☁️  Found ${cloudSongs?.length || 0} songs in Supabase database`);

    // 3. Merge with local songs
    for (const cloudSong of cloudSongs || []) {
      console.log(`   ☁️  ${cloudSong.artist} - ${cloudSong.title}`);
      const key = getSongKey(cloudSong.artist, cloudSong.title);
      const existing = songMap.get(key);

      if (existing) {
        // Song exists in both - check for conflicts
        const localDate = existing.localUpdatedAt || '';
        const cloudDate = cloudSong.updated_at || '';

        let status: SyncStatus = 'synced';

        // Check if versions differ
        if (localDate && cloudDate) {
          const localTime = new Date(localDate).getTime();
          const cloudTime = new Date(cloudDate).getTime();

          // If dates differ by more than 1 second, consider it a conflict
          if (Math.abs(localTime - cloudTime) > 1000) {
            status = 'conflict';
          }
        }

        songMap.set(key, {
          ...existing,
          syncStatus: status,
          cloudId: cloudSong.id,
          cloudUpdatedAt: cloudSong.updated_at,
        });
      } else {
        // Song only exists in cloud
        songMap.set(key, {
          artist: cloudSong.artist,
          title: cloudSong.title,
          syncStatus: 'cloud-only',
          cloudId: cloudSong.id,
          cloudUpdatedAt: cloudSong.updated_at,
          metadata: (cloudSong.metadata || {}) as SongMetadata,
        });
      }
    }

  } catch (error) {
    console.error('❌ Error processing Supabase songs:', (error as Error).message);
  }

  const unifiedList = Array.from(songMap.values());

  // Log statistics
  const stats = {
    total: unifiedList.length,
    synced: unifiedList.filter(s => s.syncStatus === 'synced').length,
    localOnly: unifiedList.filter(s => s.syncStatus === 'local-only').length,
    cloudOnly: unifiedList.filter(s => s.syncStatus === 'cloud-only').length,
    conflicts: unifiedList.filter(s => s.syncStatus === 'conflict').length,
  };

  console.log('📊 Unified song list statistics:', stats);

  return unifiedList;
}

/**
 * Sync a single song to cloud
 */
export async function syncSongToCloud(artist: string, title: string): Promise<boolean> {
  try {
    console.log(`☁️  Uploading to cloud: ${artist} - ${title}`);

    const songData = await readSong(artist, title);

    if (!songData || !songData.lyrics) {
      console.error('❌ Song has no lyrics, cannot sync');
      return false;
    }

    const fileContent = createSongFileContent(artist, title, songData.lyrics, songData.metadata);

    await uploadSongToSupabase(artist, title, fileContent);

    return true;
  } catch (error) {
    console.error(`❌ Error syncing to cloud: ${artist} - ${title}`, (error as Error).message);
    return false;
  }
}

/**
 * Sync a single song from cloud to local
 */
export async function syncSongFromCloud(artist: string, title: string): Promise<boolean> {
  try {
    console.log(`📥 Downloading from cloud: ${artist} - ${title}`);

    const fileContent = await downloadSongFromSupabase(artist, title);

    if (!fileContent) {
      console.error('❌ Song not found in cloud');
      return false;
    }

    const { lyrics, metadata } = parseSongFileContent(fileContent);

    if (!lyrics) {
      console.error('❌ Downloaded content has no lyrics');
      return false;
    }

    await saveSong(artist, title, lyrics, metadata);

    console.log(`✅ Downloaded from cloud: ${artist} - ${title}`);
    return true;
  } catch (error) {
    console.error(`❌ Error syncing from cloud: ${artist} - ${title}`, (error as Error).message);
    return false;
  }
}

/**
 * Perform full bidirectional sync
 */
export async function performFullSync(options: {
  uploadLocalOnly?: boolean;
  downloadCloudOnly?: boolean;
  resolveConflicts?: 'keep-local' | 'keep-cloud' | 'keep-newest' | 'skip';
} = {}): Promise<{
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: number;
}> {
  console.log('🔄 Starting full bidirectional sync...');

  const {
    uploadLocalOnly = true,
    downloadCloudOnly = true,
    resolveConflicts = 'keep-newest',
  } = options;

  const stats = {
    uploaded: 0,
    downloaded: 0,
    conflicts: 0,
    errors: 0,
  };

  const songs = await getUnifiedSongList();

  // Upload local-only songs
  if (uploadLocalOnly) {
    const localOnlySongs = songs.filter(s => s.syncStatus === 'local-only');
    console.log(`📤 Uploading ${localOnlySongs.length} local-only songs...`);

    for (const song of localOnlySongs) {
      const success = await syncSongToCloud(song.artist, song.title);
      if (success) {
        stats.uploaded++;
      } else {
        stats.errors++;
      }
    }
  }

  // Download cloud-only songs
  if (downloadCloudOnly) {
    const cloudOnlySongs = songs.filter(s => s.syncStatus === 'cloud-only');
    console.log(`📥 Downloading ${cloudOnlySongs.length} cloud-only songs...`);

    for (const song of cloudOnlySongs) {
      const success = await syncSongFromCloud(song.artist, song.title);
      if (success) {
        stats.downloaded++;
      } else {
        stats.errors++;
      }
    }
  }

  // Resolve conflicts
  if (resolveConflicts !== 'skip') {
    const conflictSongs = songs.filter(s => s.syncStatus === 'conflict');
    console.log(`⚠️  Resolving ${conflictSongs.length} conflicts...`);

    for (const song of conflictSongs) {
      try {
        let shouldUpload = false;

        switch (resolveConflicts) {
          case 'keep-local':
            shouldUpload = true;
            break;
          case 'keep-cloud':
            shouldUpload = false;
            break;
          case 'keep-newest':
            const localTime = new Date(song.localUpdatedAt || 0).getTime();
            const cloudTime = new Date(song.cloudUpdatedAt || 0).getTime();
            shouldUpload = localTime > cloudTime;
            break;
        }

        if (shouldUpload) {
          await syncSongToCloud(song.artist, song.title);
          console.log(`   ✅ Kept local version: ${song.artist} - ${song.title}`);
        } else {
          await syncSongFromCloud(song.artist, song.title);
          console.log(`   ✅ Kept cloud version: ${song.artist} - ${song.title}`);
        }

        stats.conflicts++;
      } catch (error) {
        console.error(`   ❌ Error resolving conflict: ${song.artist} - ${song.title}`, (error as Error).message);
        stats.errors++;
      }
    }
  }


  return stats;
}
