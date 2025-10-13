// src/lyrics/intelligent-search.ts
import * as providers from './lyrics-providers';
import { interpretLyricsQuery } from './ai-service';
import {
  saveSong,
  readSong,
  songExists,
  createSongFileContent,
  parseSongFileContent,
} from './file-system';
import {
  uploadSongToSupabase,
  downloadSongFromSupabase,
  getSupabaseClient,
} from './supabase-sync';
import { createClient } from '@supabase/supabase-js';

export interface LyricsSearchResult {
  lyrics: string;
  artist: string;
  title: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface SongSearchResult {
  title: string;
  artist: string;
  url: string;
  source: 'letrasmusic' | 'cifraclub' | 'database-cache';
}

/**
 * Intelligent lyrics search (3-level fallback):
 * 1️⃣ Supabase cache (cloud)
 * 2️⃣ Local cache (file system)
 * 3️⃣ Web providers (Letras.mus.br, CifraClub)
 */
export async function intelligentLyricsSearch(userQuery: string, progressCallback?: (message: string) => void): Promise<LyricsSearchResult | null> {
  logSection('INTELLIGENT LYRICS SEARCH');
  progressCallback?.('Iniciando busca inteligente de letras...');
  console.log('📝 Query:', userQuery);

  const { artist, title } = await resolveQuery(userQuery);
  if (!artist && !title) return null;

  const levels: Array<[string, () => Promise<LyricsSearchResult | null>]> = [
    ['Supabase Cache', () => searchSupabaseCache(artist, title)],
    ['Local Cache', () => searchLocalCache(artist, title)],
    ['Web Scraping', () => scrapeFromWeb(artist, title)],
  ];

  for (const [label, action] of levels) {
    progressCallback?.(`Verificando ${label}...`);
    logSection(label);
    const result = await safeRun(action, `Error in ${label}`);
    if (result) {
      console.log(`✅ Found at ${label}`);
      progressCallback?.(`Letra encontrada em ${label}.`);
      await persistResult(result, label !== 'Supabase Cache');
      return result;
    }
    console.log(`❌ Not found in ${label}`);
    progressCallback?.(`Não encontrada em ${label}.`);
  }

  console.log('\n🚫 No lyrics found in any source.');
  progressCallback?.('Nenhuma letra encontrada em nenhuma fonte.');
  return null;
}

//
// ─── LEVEL 0: QUERY INTERPRETATION ─────────────────────────────────────────────
//
async function resolveQuery(userQuery: string) {
  try {
    console.time('AI Interpretation');
    const { artist, title, confidence } = await interpretLyricsQuery(userQuery);
    console.timeEnd('AI Interpretation');
    console.log(`🤖 AI Parsed → Artist: "${artist}", Title: "${title}" (${confidence}%)`);
    return { artist, title };
  } catch {
    // Fallback: smart pattern detection
    const lower = userQuery.toLowerCase();
    const dash = userQuery.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    let artist = '', title = userQuery;

    if (dash) [artist, title] = dash.slice(1).map((s) => s.trim());
    else if (/^(diante do trono|hillsong|aline barros)/.test(lower)) {
      const words = userQuery.split(/\s+/);
      artist = words.slice(0, 3).join(' ');
      title = words.slice(3).join(' ');
    }
    console.log(`🧩 Fallback Parse → Artist: "${artist}", Title: "${title}"`);
    return { artist, title };
  }
}

//
// ─── LEVEL 1: SUPABASE STORAGE CACHE ───────────────────────────────────────────
//
async function searchSupabaseCache(artist: string, title: string): Promise<LyricsSearchResult | null> {
  try {
    const content = await downloadSongFromSupabase(artist, title);
    if (!content) return null;
    const { lyrics, metadata } = parseSongFileContent(content);
    return buildResult('supabase-storage', artist, title, lyrics, metadata);
  } catch (err: any) {
    if (err.message?.includes('credentials')) console.log('⚠️ Supabase not configured');
    else console.error('Supabase cache error:', err.message);
    return null;
  }
}

//
// ─── LEVEL 2: LOCAL FILE CACHE ─────────────────────────────────────────────────
//
async function searchLocalCache(artist: string, title: string): Promise<LyricsSearchResult | null> {
  if (!(await songExists(artist, title))) return null;
  const song = await readSong(artist, title);
  return buildResult('local-cache', artist, title, song.lyrics, song.metadata);
}

//
// ─── LEVEL 3: WEB SCRAPING ─────────────────────────────────────────────────────
//
async function scrapeFromWeb(artist: string, title: string): Promise<LyricsSearchResult | null> {
  const sources = [
    { name: 'letrasmusic', fn: providers.letrasmusic.searchByTitleAndArtist },
    { name: 'cifraclub', fn: providers.cifraclub.searchByTitleAndArtist },
  ];

  for (const src of sources) {
    try {
      console.log(`🌐 Trying ${src.name}...`);
      const result = await src.fn({ artist, title });
      if (result?.lyrics)
        return buildResult(src.name, artist, title, result.lyrics, {
          ...result.metadata,
          fetchedAt: new Date().toISOString(),
        });
    } catch (err: any) {
      console.log(`❌ ${src.name} failed:`, err.message);
    }
  }
  return null;
}

//
// ─── HELPERS ───────────────────────────────────────────────────────────────────
//
function buildResult(
  source: string,
  artist: string,
  title: string,
  lyrics: string,
  metadata: Record<string, any> = {}
): LyricsSearchResult {
  return {
    artist,
    title,
    lyrics,
    source,
    metadata: { ...metadata, fetchedAt: metadata.fetchedAt || new Date().toISOString() },
  };
}

async function persistResult(result: LyricsSearchResult, shouldSave: boolean) {
  if (!shouldSave) return;
  await Promise.allSettled([saveLocal(result), saveSupabase(result)]);
}

async function saveLocal(result: LyricsSearchResult) {
  try {
    await saveSong(result.artist, result.title, result.lyrics, result.metadata);
    console.log('💾 Saved locally');
  } catch (err: any) {
    console.error('Local save failed:', err.message);
  }
}

async function saveSupabase(result: LyricsSearchResult) {
  try {
    const content = createSongFileContent(result.artist, result.title, result.lyrics, result.metadata);
    await uploadSongToSupabase(result.artist, result.title, content);
    console.log('☁️ Saved to Supabase');
  } catch (err: any) {
    console.error('Supabase save failed:', err.message);
  }
}

function logSection(title: string) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 ${title}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

async function safeRun<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    console.error(`${label}:`, err.message);
    return null;
  }
}

export async function fastLyricsSearch(userQuery: string, progressCallback?: (message: string) => void): Promise<SongSearchResult[]> {
  console.log('⚡ Performing fast lyrics search for:', userQuery);
  progressCallback?.('Iniciando busca rápida de letras...');
  const { artist, title } = await resolveQuery(userQuery);
  if (!artist && !title) {
    progressCallback?.('Consulta inválida para busca rápida.');
    return [];
  }

  const allResults: SongSearchResult[] = [];
  const seenSongs = new Set<string>(); // For deduplication
  const sources = [
    { name: 'letrasmusic', fn: providers.letrasmusic.searchByTitleAndArtist },
    { name: 'cifraclub', fn: providers.cifraclub.searchByTitleAndArtist },
  ];

  for (const src of sources) {
    try {
      progressCallback?.(`Buscando em ${src.name}...`);
      console.log(`🌐 Trying fast search with ${src.name}...`);
      const results = await src.fn({ artist, title });
      if (results && Array.isArray(results)) {
        const mappedResults = results.map(r => ({
          title: r.title,
          artist: r.artist,
          url: r.url,
          source: src.name as 'letrasmusic' | 'cifraclub',
        }));
        mappedResults.forEach(r => {
          const key = `${r.title}-${r.artist}-${r.url}`;
          if (!seenSongs.has(key)) {
            seenSongs.add(key);
            allResults.push(r);
          }
        });
        progressCallback?.(`Encontrados ${mappedResults.length} resultados em ${src.name}.`);
      }
    } catch (err: any) {
      console.log(`❌ Fast search with ${src.name} failed:`, err.message);
      progressCallback?.(`Falha ao buscar em ${src.name}.`);
    }
  }

  progressCallback?.(`Busca rápida concluída. Total de ${allResults.length} resultados.`);
  return allResults;
}

export async function fetchLyricsByUrl(url: string, source: string): Promise<LyricsSearchResult | null> {
  console.log(`📥 Fetching lyrics from URL: ${url} (Source: ${source})`);
  let result: LyricsSearchResult | null = null;

  try {
    switch (source) {
      case 'letrasmusic':
        result = await providers.letrasmusic.getLyrics(url);
        break;
      case 'cifraclub':
        result = await providers.cifraclub.getLyrics(url);
        break;
      // Add other providers here as needed
      default:
        console.warn(`Unknown lyrics source: ${source}`);
        return null;
    }

    if (result?.lyrics) {
      // Optionally persist the fetched lyrics to local/supabase cache
      await persistResult(result, true);
      return result;
    }
  } catch (err: any) {
    console.error(`Error fetching lyrics from ${source} (${url}):`, err.message);
  }

  return null;
}
