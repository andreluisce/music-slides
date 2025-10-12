import fse from 'fs-extra';
import path from 'path';
import sanitize from 'sanitize-filename';
import { app } from 'electron';

/**
 * Lista todas as músicas organizadas por artista
 */
export async function getAllSongsGroupedByArtist(): Promise<{
  artist: string;
  normalizedArtist: string;
  songs: Array<{ title: string; normalizedTitle: string; filePath: string }>;
}[]> {
  const basePath = getSongsBasePath();
  await fse.ensureDir(basePath);

  const artistFolders = await fse.readdir(basePath);
  const result = [];

  for (const artistFolder of artistFolders) {
    const artistPath = `${basePath}/${artistFolder}`;
    const stats = await fse.stat(artistPath);

    if (stats.isDirectory()) {
      const songFiles = await fse.readdir(artistPath);
      const songs = songFiles
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const normalizedTitle = file.replace('.json', '');
          return {
            title: normalizedTitle.replace(/-/g, ' '), // Desnormaliza para exibição
            normalizedTitle,
            filePath: `${artistFolder}/${file}`,
          };
        });

      if (songs.length > 0) {
        result.push({
          artist: artistFolder.replace(/-/g, ' '), // Desnormaliza para exibição
          normalizedArtist: artistFolder,
          songs,
        });
      }
    }
  }

  return result;
}

/**
 * Lista todas as músicas em formato flat (compatibilidade)
 */
export async function getAllSongsFlat(): Promise<Array<{
  artist: string;
  title: string;
  filePath: string;
}>> {
  const grouped = await getAllSongsGroupedByArtist();
  const flat = [];

  for (const group of grouped) {
    for (const song of group.songs) {
      flat.push({
        artist: group.artist,
        title: song.title,
        filePath: song.filePath,
      });
    }
  }

  return flat;
}

/**
 * Lê o conteúdo de uma música e retorna lyrics + metadata
 */
export async function readSong(
  artist: string,
  title: string
): Promise<{ lyrics: string; metadata: Record<string, any> }> {
  const filePath = getSongFilePath(artist, title);
  const content = await fse.readFile(filePath, 'utf8');
  return parseSongFileContent(content);
}

/**
 * Lê apenas as lyrics (sem metadata) - compatibilidade
 */
export async function readSongLyrics(artist: string, title: string): Promise<string> {
  const { lyrics } = await readSong(artist, title);
  return lyrics;
}

/**
 * Migra músicas do formato antigo (flat) para o novo formato (por artista)
 */
export async function migrateOldSongsToNewStructure(): Promise<{
  migrated: number;
  skipped: number;
  errors: number;
}> {
  const basePath = getSongsBasePath();
  await fse.ensureDir(basePath);

  const files = await fse.readdir(basePath);
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = `${basePath}/${file}`;
    const stats = await fse.stat(filePath);

    // Ignora se já é uma pasta (novo formato)
    if (stats.isDirectory()) {
      continue;
    }

    // Migração de arquivos antigos .txt para .json (apenas para compatibilidade com versões antigas)
    if (!file.endsWith('.txt')) {
      continue;
    }

    try {
      // Parse do formato antigo: "artista - musica.txt"
      const match = file.match(/^(.+?)\s*-\s*(.+?)\.txt$/);

      if (!match) {
        console.log(`⚠️ Skipping file with invalid format: ${file}`);
        skipped++;
        continue;
      }

      const [, artist, title] = match;

      // Verifica se já existe no novo formato
      if (await songExists(artist, title)) {
        console.log(`⏭️ Already exists: ${artist} - ${title}`);
        // Remove o arquivo antigo
        await fse.remove(filePath);
        skipped++;
        continue;
      }

      // Lê o conteúdo
      const content = await fse.readFile(filePath, 'utf8');
      const { lyrics, metadata } = parseFrontmatterFileContent(content);

      // Salva no novo formato
      await saveSong(artist, title, lyrics, metadata);

      // Remove o arquivo antigo
      await fse.remove(filePath);

      migrated++;
      console.log(`✅ Migrated: ${artist} - ${title}`);
    } catch (error) {
      console.error(`❌ Error migrating ${file}:`, error);
      errors++;
    }
  }

  return { migrated, skipped, errors };
}

export async function logError(message: string, error: Error) {
  const logsDir = path.join(app.getPath('userData'), 'logs');
  await fse.ensureDir(logsDir);
  const logFilePath = path.join(logsDir, 'error.log');
  const timestamp = new Date().toISOString();
  const errorMessage = `[${timestamp}] ${message}\n${error.stack || error.toString()}\n\n`;
  await fse.appendFile(logFilePath, errorMessage);
}

/**
 * Normaliza um nome para usar como nome de pasta/arquivo
 * Remove acentos, caracteres especiais, converte para lowercase e substitui espaços por hífens
 */
export function normalizeNameForFileSystem(name: string): string {
  return sanitize(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
}

/**
 * Retorna o caminho base das músicas
 */
export function getSongsBasePath(): string {
  const documentsPath = app.getPath('documents');
  return `${documentsPath}/lyrics-slide-show/songs`;
}

/**
 * Retorna o caminho da pasta de um artista
 */
export function getArtistFolderPath(artist: string): string {
  const basePath = getSongsBasePath();
  const normalizedArtist = normalizeNameForFileSystem(artist);
  return `${basePath}/${normalizedArtist}`;
}

/**
 * Retorna o caminho completo de um arquivo de música
 */
export function getSongFilePath(artist: string, title: string): string {
  const artistFolder = getArtistFolderPath(artist);
  const normalizedTitle = normalizeNameForFileSystem(title);
  return `${artistFolder}/${normalizedTitle}.json`;
}

/**
 * Verifica se uma música já existe (evita duplicatas)
 */
export async function songExists(artist: string, title: string): Promise<boolean> {
  const filePath = getSongFilePath(artist, title);
  return fse.pathExists(filePath);
}

/**
 * Cria o conteúdo do arquivo em formato JSON
 */
export function createSongFileContent(
  artist: string,
  title: string,
  lyrics: string,
  metadata?: {
    album?: string;
    year?: number;
    genre?: string;
    language?: string;
    source?: string;
    [key: string]: any;
  }
): string {
  const now = new Date().toISOString().split('T')[0];

  const songData = {
    title,
    artist,
    lyrics,
    createdAt: now,
    updatedAt: now,
    ...metadata,
  };

  return JSON.stringify(songData, null, 2);
}

/**
 * Parse do conteúdo do arquivo JSON
 */
export function parseSongFileContent(content: string): {
  metadata: Record<string, any>;
  lyrics: string;
} {
  const songData = JSON.parse(content);
  const { lyrics, ...metadata } = songData;
  return { metadata, lyrics };
}

export function parseFrontmatterFileContent(content: string): {
  metadata: Record<string, any>;
  lyrics: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    // Formato antigo sem frontmatter
    return {
      metadata: {},
      lyrics: content,
    };
  }

  const [, frontmatterText, lyrics] = match;
  const metadata: Record<string, any> = {};

  // Parse simples de YAML (apenas key: value)
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      // Remove aspas se existirem
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/\\"/g, '"');
      }

      // Tenta converter para número
      if (!isNaN(Number(value)) && value !== '') {
        metadata[key] = Number(value);
      } else {
        metadata[key] = value;
      }
    }
  });

  return { metadata, lyrics };
}

/**
 * Salva uma música na estrutura organizada por artista (formato MDX)
 */
export async function saveSong(
  artist: string,
  title: string,
  lyrics: string,
  metadata?: {
    album?: string;
    year?: number;
    genre?: string;
    language?: string;
    source?: string;
    [key: string]: any;
  }
): Promise<string> {
  const filePath = getSongFilePath(artist, title);

  // Verifica se já existe
  if (await songExists(artist, title)) {
    console.log(`⚠️ Song already exists: ${artist} - ${title}`);
    return filePath;
  }

  // Garante que a pasta do artista existe
  const artistFolder = getArtistFolderPath(artist);
  await fse.ensureDir(artistFolder);

  // Cria conteúdo com frontmatter
  const fileContent = createSongFileContent(artist, title, lyrics, metadata);

  // Salva o arquivo
  await fse.writeFile(filePath, fileContent, 'utf8');
  console.log(`✅ Song saved: ${filePath}`);

  return filePath;
}

