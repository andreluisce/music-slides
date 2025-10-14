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
  saveSongToSupabaseTable,
  getSongFromSupabaseTable,
  getCompleteSongData,
  searchSongsIntelligent,
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
  source: 'letrasmusic' | 'database-cache';
}

/**
 * Intelligent lyrics search (3-level fallback):
 * 1️⃣ Supabase cache (cloud)
 * 2️⃣ Local cache (file system)
 * 3️⃣ Web providers (Letras.mus.br)
 */
export async function intelligentLyricsSearch(userQuery: string, progressCallback?: (message: string) => void): Promise<LyricsSearchResult | null> {
  console.time('Intelligent Lyrics Search');
  logSection('INTELLIGENT LYRICS SEARCH');
  progressCallback?.('Iniciando busca inteligente de letras...');
  console.log('📝 Query:', userQuery);

  const { artist, title } = await resolveQuery(userQuery);
  if (!artist && !title) {
    console.timeEnd('Intelligent Lyrics Search');
    return null;
  }

  const levels: Array<[string, () => Promise<LyricsSearchResult | null>]> = [
    ['Supabase Cache', () => searchSupabaseCache(artist, title)],
    ['Local Cache', () => searchLocalCache(artist, title)],
    ['Web Scraping', () => scrapeFromWeb(artist, title)],
  ];

  for (const [label, action] of levels) {
    progressCallback?.(`Verificando ${label}...`);
    logSection(label);
    console.time(label);
    const result = await safeRun(action, `Error in ${label}`);
    console.timeEnd(label);
    if (result) {
      console.log(`✅ Found at ${label}`);
      progressCallback?.(`Letra encontrada em ${label}.`);
      console.time('Persist Result');
      await persistResult(result, label !== 'Supabase Cache');
      console.timeEnd('Persist Result');
      console.timeEnd('Intelligent Lyrics Search');
      return result;
    }
    console.log(`❌ Not found in ${label}`);
    progressCallback?.(`Não encontrada em ${label}.`);
  }

  console.log('\n🚫 No lyrics found in any source.');
  progressCallback?.('Nenhuma letra encontrada em nenhuma fonte.');
  console.timeEnd('Intelligent Lyrics Search');
  return null;
}

//
// ─── LEVEL 0: QUERY INTERPRETATION ─────────────────────────────────────────────
//
async function resolveQuery(userQuery: string) {
  // Temporarily bypass AI interpretation as per user request
  // try {
  //   console.time('AI Interpretation');
  //   const { artist, title, confidence } = await interpretLyricsQuery(userQuery);
  //   console.timeEnd('AI Interpretation');
  //   console.log(`🤖 AI Parsed → Artist: "${artist}", Title: "${title}" (${confidence}%)`);
  //   return { artist, title };
  // } catch {
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
  // }
}

//
// ─── LEVEL 1: SUPABASE STORAGE CACHE ───────────────────────────────────────────
//
async function searchSupabaseCache(artist: string, title: string): Promise<LyricsSearchResult | null> {
  try {
    // Primeiro tenta buscar exatamente por artista e título
    const exactResult = await getSongFromSupabaseTable(artist, title);
    if (exactResult) {
      // Se encontrou na tabela, busca dados completos
      const completeData = await getCompleteSongData(artist, title);
      if (completeData) {
        return buildResult('supabase-table', artist, title, completeData.lyrics, completeData.metadata);
      }
    }
    
    // Se não encontrou exatamente, tenta busca inteligente por texto
    console.log('🔍 Trying intelligent text search in Supabase...');
    const searchQuery = `${artist} ${title}`;
    const searchResults = await searchSongsIntelligent(searchQuery, 5);
    
    if (searchResults && searchResults.length > 0) {
      // Pega o primeiro resultado mais relevante e busca dados completos
      const firstResult = searchResults[0];
      const completeData = await getCompleteSongData(firstResult.artist, firstResult.title);
      if (completeData) {
        console.log(`✨ Found via text search: ${firstResult.title} by ${firstResult.artist}`);
        return buildResult('supabase-search', firstResult.artist, firstResult.title, completeData.lyrics, completeData.metadata);
      }
    }
    
    // Fallback: busca no storage (método antigo)
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
    { name: 'letrasmusic', provider: global.letrasmusProvider },
  ];

  for (const src of sources) {
    try {
      console.log(`🌐 Trying ${src.name} for search...`);
      const searchResults = await src.provider.searchByTitleAndArtist({ artist, title });

      if (searchResults && searchResults.length > 0) {
        console.log(`✅ Found ${searchResults.length} potential songs from ${src.name}. Attempting to fetch lyrics...`);
        
        for (const song of searchResults) {
          try {
            const lyricsResult = await src.provider.getLyrics(song.url);
            if (lyricsResult && lyricsResult.lyrics) {
              console.log(`✅ Lyrics fetched from ${src.name} for ${song.title} - ${song.artist}`);
              return buildResult(src.name, lyricsResult.artist ?? '', lyricsResult.title ?? '', lyricsResult.lyrics, {
                url: song.url,
                fetchedAt: new Date().toISOString(),
              });
            }
          } catch (lyricsErr: any) {
            console.log(`❌ Failed to fetch lyrics for ${song.title} from ${src.name}:`, lyricsErr.message);
          }
        }
      }
      console.log(`❌ No lyrics found from ${src.name} for ${artist} - ${title}`);
    } catch (err: any) {
      console.log(`❌ ${src.name} search failed:`, err.message);
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
    // Salva no storage (arquivo completo)
    const content = createSongFileContent(result.artist, result.title, result.lyrics, result.metadata);
    const storagePath = await uploadSongToSupabase(result.artist, result.title, content);
    
    // Salva na tabela (índice + preview) com referência ao storage
    const tableSuccess = await saveSongToSupabaseTable(
      result.artist, 
      result.title, 
      result.lyrics, 
      result.metadata,
      storagePath || undefined
    );
    
    if (tableSuccess) {
      console.log('☁️ Saved to Supabase (🗄️ table + 🗁️ storage)');
    } else {
      console.log('☁️ Saved to Supabase (🗁️ storage only)');
    }
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
  console.time('Fast Lyrics Search');
  console.log('⚡ Performing fast lyrics search for:', userQuery);
  progressCallback?.('Iniciando busca rápida de letras...');
  const { artist, title } = await resolveQuery(userQuery);
  if (!artist && !title) {
    progressCallback?.('Consulta inválida para busca rápida.');
    console.timeEnd('Fast Lyrics Search');
    return [];
  }

  const allResults: SongSearchResult[] = [];
  const seenSongs = new Set<string>(); // For deduplication
  const sources = [
    { name: 'letrasmusic', provider: global.letrasmusProvider },
  ];

  for (const src of sources) {
    try {
      progressCallback?.(`Buscando em ${src.name}...`);
      console.time(src.name);
      console.log(`🌐 Trying fast search with ${src.name}...`);
      const results = await src.provider.searchByTitleAndArtist({ artist, title });
      console.timeEnd(src.name);
      if (results && Array.isArray(results)) {
        const mappedResults = results.map(r => ({
          title: r.title,
          artist: r.artist,
          url: r.url,
          source: src.name as 'letrasmusic',
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
      console.timeEnd(src.name);
      console.log(`❌ Fast search with ${src.name} failed:`, err.message);
      progressCallback?.(`Falha ao buscar em ${src.name}.`);
    }
  }

  progressCallback?.(`Busca rápida concluída. Total de ${allResults.length} resultados.`);
  console.timeEnd('Fast Lyrics Search');
  return allResults;
}

export async function fetchLyricsByUrl(url: string, source: string, progressCallback?: (message: string) => void): Promise<LyricsSearchResult | null> {
  console.log(`📥 Fetching lyrics from URL: ${url} (Source: ${source})`);
  progressCallback?.(`Iniciando busca da letra por URL em ${source}...`);
  let result: LyricsSearchResult | null = null;

  try {
    switch (source) {
      case 'letrasmusic':
        progressCallback?.('Buscando letra em Letras.mus.br...');
        const lyricsResult = await global.letrasmusProvider.getLyrics(url);
        if (lyricsResult) {
          result = {
            artist: lyricsResult.artist,
            title: lyricsResult.title,
            lyrics: lyricsResult.lyrics,
            source: lyricsResult.source,
            metadata: { url, fetchedAt: new Date().toISOString() }
          };
        }
        break;
      // Add other providers here as needed
      default:
        console.warn(`Unknown lyrics source: ${source}`);
        progressCallback?.(`Fonte de letra desconhecida: ${source}.`);
        return null;
    }

    if (result?.lyrics) {
      progressCallback?.('Letra encontrada. Persistindo dados...');
      // Optionally persist the fetched lyrics to local/supabase cache
      await persistResult(result, true);
      progressCallback?.('Letra carregada com sucesso!');
      return result;
    }
  } catch (err: any) {
    console.error(`Error fetching lyrics from ${source} (${url}):`, err.message);
    progressCallback?.(`Erro ao carregar letra de ${source}.`);
  }

  return null;
}
