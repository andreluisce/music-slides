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

// Lazy-loaded Supabase client
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    // Try both formats: with and without NEXT_PUBLIC_ prefix
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      '';
    const supabaseKey =
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';

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
    console.log(`✅ Bucket '${BUCKET_NAME}' created`);
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
