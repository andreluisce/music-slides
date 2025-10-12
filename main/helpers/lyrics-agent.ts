import * as letrasmusic from './lyrics-providers/letrasmusic.provider';
import * as cifraclub from './lyrics-providers/cifraclub.provider';
import { saveSong, readSong, songExists, createSongFileContent } from './file-system';
import { uploadSongToSupabase, downloadSongFromSupabase } from './supabase-sync';
import { interpretLyricsQuery } from './ai-service';

export interface LyricsSearchResult {
  lyrics: string;
  artist: string;
  title: string;
  source: string;
  metadata?: {
    album?: string;
    year?: number;
    genre?: string;
    language?: string;
    fetchedAt?: string;
    [key: string]: any;
  };
}

/**
 * Intelligent lyrics search with 3-level fallback system:
 * 1. Supabase cache (cloud)
 * 2. Local cache (file system)
 * 3. Web scraping (Playwright - Letras.mus.br, CifraClub)
 */
export async function intelligentLyricsSearch(
  userQuery: string
): Promise<LyricsSearchResult | null> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 STARTING INTELLIGENT LYRICS SEARCH');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 User Query:', userQuery);

  // Step 0: Use AI to interpret the query
  let artist = '';
  let title = '';
  let confidence = 0;

  try {
    console.log('\n🤖 Step 0: AI Interpretation...');
    const aiInterpretation = await interpretLyricsQuery(userQuery);
    artist = aiInterpretation.artist;
    title = aiInterpretation.title;
    confidence = aiInterpretation.confidence;

    console.log('✅ AI interpretation successful!');
    console.log('   Artist:', artist);
    console.log('   Title:', title);
    console.log('   Confidence:', confidence + '%');
  } catch (error) {
    console.error('❌ AI interpretation failed:', error.message);
    console.log('🔄 Falling back to manual parsing...');

    // Smart parsing for common patterns
    const lowerQuery = userQuery.toLowerCase();

    // Pattern 1: "artist - title" or "artist — title"
    const dashPattern = userQuery.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (dashPattern) {
      artist = dashPattern[1].trim();
      title = dashPattern[2].trim();
      console.log('   📋 Pattern: Artist - Title');
    }
    // Pattern 2: Known artists in the beginning
    else if (
      lowerQuery.startsWith('diante do trono') ||
      lowerQuery.startsWith('hillsong') ||
      lowerQuery.startsWith('aline barros')
    ) {
      const match = userQuery.match(/^([a-záàâãéèêíïóôõöúçñ\s]+)/i);
      if (match) {
        const words = match[1].trim().split(/\s+/);
        // Take first 2-3 words as artist
        if (words.length >= 3 && lowerQuery.startsWith('diante do trono')) {
          artist = words.slice(0, 3).join(' ');
          title = words.slice(3).join(' ');
        } else if (words.length >= 2) {
          artist = words.slice(0, 2).join(' ');
          title = words.slice(2).join(' ');
        }
      }
      console.log('   📋 Pattern: Known Artist');
    }
    // Pattern 3: Use entire query as title
    else {
      title = userQuery;
      artist = '';
      console.log('   📋 Pattern: Title only');
    }

    console.log('   Parsed Artist:', artist || '(empty)');
    console.log('   Parsed Title:', title);
    confidence = 50; // Medium confidence for manual parsing
  }

  // Step 1: Check Supabase cache (cloud)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣ LEVEL 1: Supabase Storage Cache');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const supabaseResult = await searchInSupabase(artist, title);
  if (supabaseResult) {
    console.log('✅ SUCCESS: Found in Supabase cache!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return supabaseResult;
  }
  console.log('❌ Not found in Supabase cache');

  // Step 2: Check local cache (file system)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣ LEVEL 2: Local File System Cache');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const localResult = await searchInLocalCache(artist, title);
  if (localResult) {
    console.log('✅ SUCCESS: Found in local cache!');
    console.log('📤 Uploading to Supabase for future use...');
    await saveToSupabase(localResult);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return localResult;
  }
  console.log('❌ Not found in local cache');

  // Step 3: Try web scraping (Playwright)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣ LEVEL 3: Web Scraping (Playwright)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const scrapingResult = await tryWebScraping(artist, title);
  if (scrapingResult) {
    console.log('✅ SUCCESS: Found via web scraping!');
    console.log('💾 Saving to both caches...');
    await saveEverywhere(scrapingResult);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return scrapingResult;
  }
  console.log('❌ Not found via web scraping');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ SEARCH FAILED: No lyrics found from any source');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return null;
}

/**
 * Search in Supabase cache (Storage)
 */
async function searchInSupabase(
  artist: string,
  title: string
): Promise<LyricsSearchResult | null> {
  try {
    console.log('   🔍 Searching in Supabase Storage...');
    console.log('   📝 Artist:', artist);
    console.log('   📝 Title:', title);

    const fileContent = await downloadSongFromSupabase(artist, title);

    if (!fileContent) {
      console.log('   ⚠️  File not found in Supabase Storage');
      return null;
    }

    console.log('   ✅ File found! Parsing content...');

    // Parse the file content (has frontmatter)
    const { parseSongFileContent } = await import('./file-system');
    const { lyrics, metadata } = parseSongFileContent(fileContent);

    console.log('   📄 Lyrics length:', lyrics.length, 'characters');

    return {
      lyrics,
      artist: metadata.artist || artist,
      title: metadata.title || title,
      source: 'supabase-storage',
      metadata: {
        ...metadata,
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    // Supabase errors are expected when credentials are missing or file doesn't exist
    if (error.message?.includes('credentials not found')) {
      console.log('   ⚠️  Supabase not configured, skipping...');
    } else {
      console.log('   ⚠️  Supabase error:', error.message);
    }
    return null;
  }
}

/**
 * Search in local file system cache
 */
async function searchInLocalCache(
  artist: string,
  title: string
): Promise<LyricsSearchResult | null> {
  try {
    console.log('   🔍 Searching in local file system...');
    console.log('   📝 Artist:', artist);
    console.log('   📝 Title:', title);

    const exists = await songExists(artist, title);
    if (!exists) {
      console.log('   ⚠️  File not found locally');
      return null;
    }

    console.log('   ✅ File found! Reading content...');
    const songData = await readSong(artist, title);
    console.log('   📄 Lyrics length:', songData.lyrics.length, 'characters');

    return {
      lyrics: songData.lyrics,
      artist: songData.metadata.artist || artist,
      title: songData.metadata.title || title,
      source: 'local-cache',
      metadata: {
        ...songData.metadata,
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('   ❌ Local cache search error:', error.message);
    return null;
  }
}

/**
 * Try web scraping with Playwright
 */
async function tryWebScraping(
  artist: string,
  title: string
): Promise<LyricsSearchResult | null> {
  console.log('   📝 Artist:', artist);
  console.log('   📝 Title:', title);

  // Try Letras.mus.br first
  try {
    console.log('\n   🌐 Attempting Letras.mus.br...');
    const result = await letrasmusic.searchByTitleAndArtist({ artist, title });
    if (result && result.lyrics) {
      console.log('   ✅ SUCCESS from Letras.mus.br!');
      console.log('   📄 Lyrics length:', result.lyrics.length, 'characters');
      return {
        ...result,
        metadata: {
          genre: 'Gospel',
          language: 'pt-BR',
          source: 'letrasmusic',
          fetchedAt: new Date().toISOString(),
        },
      };
    }
    console.log('   ❌ No result from Letras.mus.br');
  } catch (error) {
    console.error('   ❌ Letras.mus.br error:', error.message);
    console.error('   📋 Stack:', error.stack);
  }

  // Try CifraClub
  try {
    console.log('\n   🎸 Attempting CifraClub...');
    const result = await cifraclub.searchByTitleAndArtist({ artist, title });
    if (result && result.lyrics) {
      console.log('   ✅ SUCCESS from CifraClub!');
      console.log('   📄 Lyrics length:', result.lyrics.length, 'characters');
      return {
        ...result,
        metadata: {
          genre: 'Gospel',
          language: 'pt-BR',
          source: 'cifraclub',
          fetchedAt: new Date().toISOString(),
        },
      };
    }
    console.log('   ❌ No result from CifraClub');
  } catch (error) {
    console.error('   ❌ CifraClub error:', error.message);
    console.error('   📋 Stack:', error.stack);
  }

  return null;
}


/**
 * Save to Supabase only
 */
async function saveToSupabase(result: LyricsSearchResult): Promise<void> {
  try {
    const fileContent = createSongFileContent(
      result.artist,
      result.title,
      result.lyrics,
      result.metadata
    );
    await uploadSongToSupabase(result.artist, result.title, fileContent);
    console.log('☁️ Saved to Supabase Storage');
  } catch (error) {
    console.error('Error saving to Supabase:', error.message);
  }
}

/**
 * Save to both Supabase and local file system
 */
async function saveEverywhere(result: LyricsSearchResult): Promise<void> {
  // Save to local file system
  try {
    await saveSong(result.artist, result.title, result.lyrics, result.metadata);
    console.log('💾 Saved to local file system');
  } catch (error) {
    console.error('Error saving to local:', error.message);
  }

  // Save to Supabase Storage
  try {
    const fileContent = createSongFileContent(
      result.artist,
      result.title,
      result.lyrics,
      result.metadata
    );
    await uploadSongToSupabase(result.artist, result.title, fileContent);
    console.log('☁️ Saved to Supabase Storage');
  } catch (error) {
    console.error('Error saving to Supabase:', error.message);
  }
}

/**
 * Fast search: Get list of song results without fetching full lyrics
 * Returns quickly so user can choose the right song
 */
export interface SongSearchResult {
  title: string;
  artist: string;
  url: string;
  source: 'letrasmusic' | 'cifraclub';
}

export async function fastLyricsSearch(
  userQuery: string
): Promise<SongSearchResult[]> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚡ FAST SEARCH: Getting song list');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Query:', userQuery);

  const results: SongSearchResult[] = [];

  // Try both providers in parallel for speed
  const [letrasResults, cifraResults] = await Promise.allSettled([
    letrasmusic.findByAnyParameter(userQuery),
    cifraclub.findByAnyParameter(userQuery),
  ]);

  // Add Letras.mus.br results
  if (letrasResults.status === 'fulfilled' && letrasResults.value) {
    results.push(...letrasResults.value.map(r => ({
      title: r.title,
      artist: r.artist,
      url: r.url,
      source: 'letrasmusic' as const,
    })));
  }

  // Add CifraClub results
  if (cifraResults.status === 'fulfilled' && cifraResults.value) {
    results.push(...cifraResults.value.map(r => ({
      title: r.title,
      artist: r.artist,
      url: r.url,
      source: 'cifraclub' as const,
    })));
  }

  console.log(`✅ Found ${results.length} results total`);
  return results;
}

/**
 * Fetch full lyrics for a specific song URL chosen by user
 */
export async function fetchLyricsByUrl(
  url: string,
  source: 'letrasmusic' | 'cifraclub'
): Promise<LyricsSearchResult | null> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 FETCHING LYRICS from URL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 URL:', url);
  console.log('📍 Source:', source);

  // Extract artist and title from URL
  const urlParts = url.split('/').filter(Boolean);
  const artist = urlParts[urlParts.length - 2]?.replace(/-/g, ' ') || '';
  const title = urlParts[urlParts.length - 1]?.replace(/-/g, ' ').replace(/\.(html|htm)/, '') || '';

  console.log('   Artist:', artist);
  console.log('   Title:', title);

  // Check caches first (Supabase + Local)
  console.log('\n🔍 Checking caches...');

  // Check Supabase
  try {
    const supabaseResult = await searchInSupabase(artist, title);
    if (supabaseResult) {
      console.log('✅ Found in Supabase cache!');
      return supabaseResult;
    }
  } catch (error) {
    console.log('⚠️  Supabase check failed:', error.message);
  }

  // Check local
  try {
    const localResult = await searchInLocalCache(artist, title);
    if (localResult) {
      console.log('✅ Found in local cache!');
      await saveToSupabase(localResult);
      return localResult;
    }
  } catch (error) {
    console.log('⚠️  Local check failed:', error.message);
  }

  // Fetch from web
  console.log('\n🌐 Fetching from web...');
  let result: LyricsSearchResult | null = null;

  if (source === 'letrasmusic') {
    result = await letrasmusic.searchByTitleAndArtist({ artist, title });
  } else if (source === 'cifraclub') {
    result = await cifraclub.searchByTitleAndArtist({ artist, title });
  }

  if (result) {
    console.log('✅ Lyrics fetched successfully!');
    await saveEverywhere(result);
    return result;
  }

  console.log('❌ Failed to fetch lyrics');
  return null;
}
