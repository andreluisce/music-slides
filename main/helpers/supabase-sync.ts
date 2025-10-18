import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fse from 'fs-extra';
import {
  getAllSongsGroupedByArtist,
  getArtistFolderPath,
  getSongFilePath,
  saveSong,
  normalizeNameForFileSystem,
} from './file-system';

const BUCKET_NAME = 'songs';
const TABLE_NAME = 'songs'; // Nome da tabela

// Lazy-loaded Supabase client
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials not found!');
      console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
      console.error('   SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
      throw new Error('Supabase credentials not found in environment variables');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');
  }
  return supabaseClient;
}

/**
 * Garante que o bucket existe
 */
async function ensureBucket() {
  const supabase = getSupabaseClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 1024 * 1024, // 1MB
    });
  }
}

/**
 * Faz upload de uma música para o Supabase Storage
 * @param fileContent - Conteúdo completo do arquivo (frontmatter + lyrics)
 */
export async function uploadSongToSupabase(
  artist: string,
  title: string,
  fileContent: string
): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    await ensureBucket();

    const normalizedArtist = normalizeNameForFileSystem(artist);
    const normalizedTitle = normalizeNameForFileSystem(title);
    const filePath = `${normalizedArtist}/${normalizedTitle}.json`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileContent, {
        contentType: 'application/json; charset=utf-8',
        upsert: true, // Sobrescreve se já existir
      });

    if (error) {
      console.error('❌ Error uploading to Supabase:', error);
      return null;
    }

    console.log(`☁️ Uploaded to Supabase: ${filePath} (with metadata)`);
    return data.path;
  } catch (error) {
    console.error('❌ Supabase upload failed:', error);
    return null;
  }
}

/**
 * Baixa uma música do Supabase Storage
 * @returns Conteúdo completo do arquivo (frontmatter + lyrics)
 */
export async function downloadSongFromSupabase(
  artist: string,
  title: string
): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const normalizedArtist = normalizeNameForFileSystem(artist);
    const normalizedTitle = normalizeNameForFileSystem(title);
    const filePath = `${normalizedArtist}/${normalizedTitle}.json`;

    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(filePath);

    if (error) {
      console.error('❌ Error downloading from Supabase:', error);
      return null;
    }

    const fileContent = await data.text();
    console.log(`☁️ Downloaded from Supabase: ${filePath} (with metadata)`);

    // Validate that it's valid JSON
    try {
      JSON.parse(fileContent);
    } catch (parseError) {
      console.error(`❌ Invalid JSON downloaded from ${filePath}:`, parseError);
      return null;
    }

    return fileContent;
  } catch (error) {
    console.error('❌ Supabase download failed:', error);
    return null;
  }
}

/**
 * Lista todas as músicas no Supabase Storage
 */
export async function listSupabaseSongs(): Promise<
  Array<{ artist: string; title: string; path: string }>
> {
  try {
    const supabase = getSupabaseClient();
    await ensureBucket();

    const { data: files, error } = await supabase.storage.from(BUCKET_NAME).list('', {
      limit: 1000,
    });

    if (error) {
      console.error('❌ Error listing Supabase files:', error);
      return [];
    }

    const songs = [];

    // Lista todas as pastas de artistas
    for (const folder of files || []) {
      if (folder.id) {
        const { data: songFiles } = await supabase.storage.from(BUCKET_NAME).list(folder.name, {
          limit: 1000,
        });

        for (const file of songFiles || []) {
          if (file.name.endsWith('.json')) {
            songs.push({
              artist: folder.name.replace(/-/g, ' '),
              title: file.name.replace('.json', '').replace(/-/g, ' '),
              path: `${folder.name}/${file.name}`,
            });
          }
        }
      }
    }

    return songs;
  } catch (error) {
    console.error('❌ Failed to list Supabase songs:', error);
    return [];
  }
}

/**
 * Salva uma música na tabela do Supabase Database
 * @param artist - Nome do artista
 * @param title - Título da música
 * @param lyrics - Letra da música
 * @param metadata - Metadados adicionais
 */
export async function saveSongToSupabaseTable(
  artist: string,
  title: string,
  lyrics: string,
  metadata: Record<string, any> = {},
  storagePath?: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    // Cria preview das letras (primeiras 200 caracteres)
    const lyricsPreview = lyrics.length > 200
      ? lyrics.substring(0, 200) + '...'
      : lyrics;

    // Monta caminho do storage se não fornecido
    const defaultStoragePath = storagePath ||
      `${normalizeNameForFileSystem(artist)}/${normalizeNameForFileSystem(title)}.json`;

    const songData = {
      artist,
      title,
      lyrics,  // Add full lyrics to the table
      provider: metadata.source || metadata.provider || 'unknown',  // Changed from 'source' to 'provider'
      metadata: {
        ...metadata,
        url: metadata.url || null,  // Store URL in metadata JSON column
        lyrics_preview: lyricsPreview,  // Store preview in metadata
        lyrics_length: lyrics.length,  // Store length in metadata
        storage_path: defaultStoragePath,  // Store storage path in metadata
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(songData, {
        onConflict: 'artist,title', // Evita duplicatas baseado em artista + título
        ignoreDuplicates: false, // Atualiza se já existir
      });

    if (error) {
      console.error('❌ Error saving to Supabase table:', error);
      return false;
    }

    console.log(`🗄️ Saved to Supabase table: ${artist} - ${title} (${lyrics.length} chars)`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save to Supabase table:', error);
    return false;
  }
}

/**
 * Busca uma música na tabela do Supabase Database
 * @param artist - Nome do artista
 * @param title - Título da música
 */
export async function getSongFromSupabaseTable(
  artist: string,
  title: string
): Promise<any | null> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('artist', artist)
      .eq('title', title)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found, não é um erro
        return null;
      }
      console.error('❌ Error fetching from Supabase table:', error);
      return null;
    }

    console.log(`🗄️ Found in Supabase table: ${artist} - ${title}`);
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch from Supabase table:', error);
    return null;
  }
}

/**
 * Lista todas as músicas na tabela do Supabase Database
 */
export async function listSongsFromSupabaseTable(): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error listing from Supabase table:', error);
      return [];
    }

    console.log(`🗄️ Listed ${data?.length || 0} songs from Supabase table`);
    return data || [];
  } catch (error) {
    console.error('❌ Failed to list from Supabase table:', error);
    return [];
  }
}

/**
 * Busca inteligente: Tabela primeiro (rápido) depois Storage (completo)
 * @param artist - Nome do artista
 * @param title - Título da música
 * @returns Dados completos da música
 */
export async function getCompleteSongData(
  artist: string,
  title: string
): Promise<{ lyrics: string; metadata: any; source: string } | null> {
  try {
    // 1º: Busca na tabela para verificar se existe e pegar storage_path
    const tableData = await getSongFromSupabaseTable(artist, title);

    if (tableData && tableData.storage_path) {
      // 2º: Busca o arquivo completo no storage
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.storage.from(BUCKET_NAME).download(tableData.storage_path);

      if (!error && data) {
        const content = await data.text();
        const parsed = JSON.parse(content);

        console.log(`📋 Complete song data retrieved for: ${artist} - ${title}`);
        return {
          lyrics: parsed.lyrics,
          metadata: parsed.metadata || {},
          source: tableData.provider || 'unknown',  // Changed from tableData.source to tableData.provider
        };
      }
    }

    // 3º: Fallback para busca direta no storage (caso não tenha na tabela)
    const content = await downloadSongFromSupabase(artist, title);
    if (content) {
      const parsed = JSON.parse(content);
      console.log(`📋 Song data retrieved from storage fallback: ${artist} - ${title}`);
      return {
        lyrics: parsed.lyrics,
        metadata: parsed.metadata || {},
        source: parsed.metadata?.source || 'unknown',
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to get complete song data:', error);
    return null;
  }
}

/**
 * Lista músicas com preview rápido (apenas tabela)
 * @param limit - Número máximo de resultados
 */
export async function listSongsPreview(limit = 50): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('artist, title, provider, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error listing songs preview:', error);
      return [];
    }

    console.log(`🎵 Listed ${data?.length || 0} songs (preview mode)`);
    return data || [];
  } catch (error) {
    console.error('❌ Failed to list songs preview:', error);
    return [];
  }
}

/**
 * Busca por texto completo usando PostgreSQL Full-Text Search
 * @param query - Termo de busca
 * @param limit - Número máximo de resultados
 * @returns Lista de músicas ordenada por relevância
 */
export async function searchSongsByText(
  query: string,
  limit = 20
): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();

    // Normaliza o termo de busca
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return [];
    }

    console.log(`🔍 Full-text search for: "${normalizedQuery}"`);

    // Usa o padrão simples do Supabase JS
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('title, artist, provider, metadata, created_at')
      .textSearch('search_vector', normalizedQuery, {
        type: 'plain', // ou 'websearch' para aceitar operadores tipo Google
        config: 'simple',
      })
      .limit(limit);

    if (error) {
      console.error('❌ Full-text search failed:', error);
      return [];
    }

    console.log(`🎵 Found ${data?.length || 0} songs via full-text search`);
    return data || [];
  } catch (error) {
    console.error('❌ Failed to search songs by text:', error);
    return [];
  }
}

/**
 * Busca simples por artista ou título (ILIKE)
 * @param query - Termo de busca
 * @param limit - Número máximo de resultados
 */
export async function searchSongsSimple(
  query: string,
  limit = 20
): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();
    const searchTerm = `%${query.trim()}%`;

    console.log(`🔍 Simple search for: "${query}"`);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('artist, title, provider, metadata, created_at')
      .or(`artist.ilike.${searchTerm},title.ilike.${searchTerm}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Simple search failed:', error);
      return [];
    }

    console.log(`🎵 Found ${data?.length || 0} songs via simple search`);
    return data || [];
  } catch (error) {
    console.error('❌ Failed to search songs:', error);
    return [];
  }
}

/**
 * Busca inteligente: Primeiro Full-Text Search, depois busca simples
 * @param query - Termo de busca
 * @param limit - Número máximo de resultados
 */
export async function searchSongsIntelligent(
  query: string,
  limit = 20
): Promise<any[]> {
  try {
    // Primeiro tenta busca por texto completo
    const fullTextResults = await searchSongsByText(query, limit);

    if (fullTextResults.length > 0) {
      console.log(`✨ Intelligent search: Found ${fullTextResults.length} results via full-text search`);
      return fullTextResults;
    }

    // Se não encontrou, tenta busca simples
    console.log('✨ Intelligent search: Falling back to simple search');
    const simpleResults = await searchSongsSimple(query, limit);

    console.log(`✨ Intelligent search: Found ${simpleResults.length} results via simple search`);
    return simpleResults;
  } catch (error) {
    console.error('❌ Intelligent search failed:', error);
    return [];
  }
}

/**
 * Sincroniza músicas locais para o Supabase
 */
export async function syncLocalToSupabase(): Promise<{
  uploaded: number;
  errors: number;
}> {
  try {
    const localSongs = await getAllSongsGroupedByArtist();
    let uploaded = 0;
    let errors = 0;

    for (const artistGroup of localSongs) {
      for (const song of artistGroup.songs) {
        try {
          const lyrics = await fse.readFile(
            `${getArtistFolderPath(artistGroup.artist)}/${song.normalizedTitle}.json`,
            'utf8'
          );

          const result = await uploadSongToSupabase(artistGroup.artist, song.title, lyrics);

          if (result) {
            uploaded++;
          } else {
            errors++;
          }
        } catch (error) {
          console.error(`❌ Error syncing ${artistGroup.artist} - ${song.title}:`, error);
          errors++;
        }
      }
    }

    console.log(`✅ Sync complete: ${uploaded} uploaded, ${errors} errors`);
    return { uploaded, errors };
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return { uploaded: 0, errors: 1 };
  }
}

/**
 * Sincroniza músicas do Supabase para local
 */
export async function syncSupabaseToLocal(): Promise<{
  downloaded: number;
  errors: number;
}> {
  try {
    const supabaseSongs = await listSupabaseSongs();
    let downloaded = 0;
    let errors = 0;

    for (const song of supabaseSongs) {
      try {
        const lyrics = await downloadSongFromSupabase(song.artist, song.title);

        if (lyrics) {
          await saveSong(song.artist, song.title, lyrics);
          downloaded++;
        } else {
          errors++;
        }
      } catch (error) {
        console.error(`❌ Error downloading ${song.artist} - ${song.title}:`, error);
        errors++;
      }
    }

    console.log(`✅ Download complete: ${downloaded} downloaded, ${errors} errors`);
    return { downloaded, errors };
  } catch (error) {
    console.error('❌ Download failed:', error);
    return { downloaded: 0, errors: 1 };
  }
}

/**
 * Sincronização bidirecional (inteligente)
 */
export async function syncBidirectional(): Promise<{
  uploaded: number;
  downloaded: number;
  errors: number;
}> {
  console.log('🔄 Starting bidirectional sync...');

  // Baixa músicas do Supabase que não existem localmente
  const downloadResult = await syncSupabaseToLocal();

  // Faz upload de músicas locais que não existem no Supabase
  const uploadResult = await syncLocalToSupabase();

  return {
    uploaded: uploadResult.uploaded,
    downloaded: downloadResult.downloaded,
    errors: uploadResult.errors + downloadResult.errors,
  };
}
