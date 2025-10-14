/**
 * Tipos centralizados da aplicação Music Slides
 * Este arquivo contém todas as interfaces, tipos e enums compartilhados
 */

import { Database } from './database.types';

// ============================================================================
// DATABASE TYPES (Extraídos do Supabase)
// ============================================================================

export type Song = Database['public']['Tables']['songs']['Row'];
export type SongInsert = Database['public']['Tables']['songs']['Insert'];
export type SongUpdate = Database['public']['Tables']['songs']['Update'];

export type Presentation = Database['public']['Tables']['presentations']['Row'];
export type PresentationInsert = Database['public']['Tables']['presentations']['Insert'];
export type PresentationUpdate = Database['public']['Tables']['presentations']['Update'];

export type PresentationItem = Database['public']['Tables']['presentation_items']['Row'];
export type PresentationItemInsert = Database['public']['Tables']['presentation_items']['Insert'];
export type PresentationItemUpdate = Database['public']['Tables']['presentation_items']['Update'];

export type CustomSlide = Database['public']['Tables']['custom_slides']['Row'];
export type CustomSlideInsert = Database['public']['Tables']['custom_slides']['Insert'];
export type CustomSlideUpdate = Database['public']['Tables']['custom_slides']['Update'];

export type Theme = Database['public']['Tables']['themes']['Row'];
export type ThemeInsert = Database['public']['Tables']['themes']['Insert'];
export type ThemeUpdate = Database['public']['Tables']['themes']['Update'];

export type Tag = Database['public']['Tables']['tags']['Row'];
export type TagInsert = Database['public']['Tables']['tags']['Insert'];
export type TagUpdate = Database['public']['Tables']['tags']['Update'];

export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type FavoriteInsert = Database['public']['Tables']['favorites']['Insert'];
export type FavoriteUpdate = Database['public']['Tables']['favorites']['Update'];

export type VideoBackground = Database['public']['Tables']['video_backgrounds']['Row'];
export type VideoBackgroundInsert = Database['public']['Tables']['video_backgrounds']['Insert'];
export type VideoBackgroundUpdate = Database['public']['Tables']['video_backgrounds']['Update'];

export type PresentationHistory = Database['public']['Tables']['presentation_history']['Row'];
export type PresentationHistoryInsert = Database['public']['Tables']['presentation_history']['Insert'];
export type PresentationHistoryUpdate = Database['public']['Tables']['presentation_history']['Update'];

export type AppSettings = Database['public']['Tables']['app_settings']['Row'];
export type AppSettingsInsert = Database['public']['Tables']['app_settings']['Insert'];
export type AppSettingsUpdate = Database['public']['Tables']['app_settings']['Update'];

// ============================================================================
// EXTENDED TYPES (Com relacionamentos e campos computados)
// ============================================================================

/**
 * Música com informações adicionais (tags, favorito, etc)
 */
export interface SongWithRelations extends Song {
  tags?: Tag[];
  isFavorite?: boolean;
  usage_count?: number;
  last_used?: string;
}

/**
 * Apresentação com seus itens
 */
export interface PresentationWithItems extends Presentation {
  items?: PresentationItemWithRelations[];
  total_duration?: number;
}

/**
 * Item de apresentação com relações carregadas
 */
export interface PresentationItemWithRelations extends PresentationItem {
  song?: Song;
  custom_slide?: CustomSlide;
  video?: VideoBackground;
  theme?: Theme;
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export enum ItemType {
  SONG = 'song',
  CUSTOM_SLIDE = 'custom_slide',
  VIDEO = 'video',
  THEME = 'theme',
  IMAGE = 'image',
  BIBLE = 'bible'
}

export enum SlideType {
  TITLE = 'title',
  VERSE = 'verse',
  CHORUS = 'chorus',
  BRIDGE = 'bridge',
  ANNOUNCEMENT = 'announcement',
  SCRIPTURE = 'scripture',
  BLANK = 'blank',
  IMAGE = 'image'
}

export enum ViewMode {
  LIST = 'list',
  GRID = 'grid',
  COMPACT = 'compact'
}

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
  CONFLICT = 'conflict'
}

export enum LyricsProvider {
  LETRASMUSIC = 'letrasmusic',
  LETRASMUS = 'letrasmus',
  LOCAL = 'local',
  MANUAL = 'manual'
}

// ============================================================================
// UI TYPES
// ============================================================================

/**
 * Opções de filtro para biblioteca de músicas
 */
export interface SongFilters {
  search?: string;
  tags?: string[];
  favorites?: boolean;
  artist?: string;
  language?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasLyrics?: boolean;
}

/**
 * Opções de ordenação
 */
export interface SortOptions {
  field: 'title' | 'artist' | 'created_at' | 'updated_at' | 'usage_count';
  direction: 'asc' | 'desc';
}

/**
 * Paginação
 */
export interface Pagination {
  page: number;
  pageSize: number;
  total?: number;
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// COMMAND PALETTE TYPES
// ============================================================================

export enum CommandCategory {
  NAVIGATION = 'navigation',
  SONGS = 'songs',
  PRESENTATIONS = 'presentations',
  THEMES = 'themes',
  SETTINGS = 'settings',
  HELP = 'help'
}

export interface Command {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  keywords?: string[];
  icon?: string;
  shortcut?: string;
  action: () => void | Promise<void>;
  enabled?: boolean;
}

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  commands: Command[];
}

// ============================================================================
// PLAYLIST TYPES
// ============================================================================

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songs: string[]; // Array de song IDs
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
  tags?: string[];
  is_smart?: boolean;
  smart_filters?: SongFilters;
}

export type PlaylistInsert = Omit<Playlist, 'id' | 'created_at' | 'updated_at'>;
export type PlaylistUpdate = Partial<PlaylistInsert>;

/**
 * Playlist com músicas carregadas
 */
export interface PlaylistWithSongs extends Playlist {
  songs_data?: SongWithRelations[];
  total_songs?: number;
  total_duration?: number;
}

// ============================================================================
// SYNCHRONIZATION TYPES
// ============================================================================

/**
 * Metadados de sincronização para controle de versão
 */
export interface SyncMetadata {
  lastSyncedAt: string;
  version: number;
  device_id: string;
  checksum?: string;
}

/**
 * Conflito de sincronização
 */
export interface SyncConflict<T = any> {
  id: string;
  local: T & { metadata: SyncMetadata };
  remote: T & { metadata: SyncMetadata };
  conflictType: 'update' | 'delete';
  resolvedAt?: string;
  resolution?: 'local' | 'remote' | 'merge';
}

/**
 * Resultado de sincronização
 */
export interface SyncResult {
  status: SyncStatus;
  timestamp: string;
  conflicts?: SyncConflict[];
  stats: {
    pushed: number;
    pulled: number;
    updated: number;
    deleted: number;
    conflicts: number;
  };
  error?: Error;
}

/**
 * Configurações de sincronização
 */
export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // em minutos
  conflictResolution: 'manual' | 'local-wins' | 'remote-wins' | 'newest-wins';
  syncOnStartup: boolean;
  syncOnClose: boolean;
}

// ============================================================================
// LYRICS TYPES
// ============================================================================

/**
 * Estrutura de letra de música processada
 */
export interface LyricsStructure {
  title: string;
  artist: string;
  sections: LyricsSection[];
  metadata?: LyricsMetadata;
}

export interface LyricsSection {
  type: SlideType;
  label?: string; // "Verse 1", "Chorus", etc
  lines: string[];
  order: number;
}

export interface LyricsMetadata {
  key?: string; // Tom musical
  tempo?: number; // BPM
  duration?: number; // Duração em segundos
  year?: number;
  album?: string;
  genre?: string;
  language?: string;
  copyright?: string;
  ccli?: string; // CCLI Song Number
}

/**
 * Resultado de busca de letras
 */
export interface LyricsSearchResult {
  provider: LyricsProvider;
  title: string;
  artist: string;
  url?: string;
  preview?: string;
  confidence?: number; // 0-1, quão confiante é o match
}

/**
 * Progresso de busca de letras
 */
export interface LyricsSearchProgress {
  status: 'searching' | 'found' | 'not_found' | 'error';
  provider?: LyricsProvider;
  message?: string;
  progress?: number; // 0-100
}

// ============================================================================
// PRESENTATION MODE TYPES
// ============================================================================

/**
 * Estado do modo de apresentação
 */
export interface PresentationState {
  isActive: boolean;
  presentationId?: string;
  currentItemIndex: number;
  currentSlideIndex: number;
  totalItems: number;
  totalSlides: number;
  isPlaying: boolean;
  isPaused: boolean;
  startedAt?: string;
  duration?: number;
}

/**
 * Configurações de apresentação
 */
export interface PresentationSettings {
  transitionType: 'fade' | 'slide' | 'zoom' | 'none';
  transitionDuration: number; // ms
  autoAdvance: boolean;
  autoAdvanceDelay: number; // segundos
  loopPresentation: boolean;
  showClock: boolean;
  showTimer: boolean;
  blackScreenShortcut: string;
  clearScreenShortcut: string;
  outputDisplay?: number; // índice do display para output
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Estatísticas de uso
 */
export interface UsageStats {
  total_songs: number;
  total_presentations: number;
  total_presentations_shown: number;
  most_used_songs: Array<{ song_id: string; count: number }>;
  most_used_themes: Array<{ theme_id: string; count: number }>;
  total_presentation_time: number; // em segundos
  average_presentation_time: number;
  period: {
    from: string;
    to: string;
  };
}

/**
 * Análise de uma música
 */
export interface SongAnalytics {
  song_id: string;
  usage_count: number;
  last_used: string;
  total_presentation_time: number;
  average_presentation_time: number;
  presentations: string[]; // IDs das apresentações
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

/**
 * Resultado de busca unificado
 */
export interface SearchResult {
  type: 'song' | 'presentation' | 'playlist' | 'command';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
  relevance?: number; // Score de relevância 0-1
}

/**
 * Opções de busca
 */
export interface SearchOptions {
  query: string;
  types?: SearchResult['type'][];
  limit?: number;
  filters?: SongFilters;
  fuzzy?: boolean;
  includeMetadata?: boolean;
}

// ============================================================================
// EXPORT/IMPORT TYPES
// ============================================================================

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PROPRESENTER = 'propresenter',
  POWERPOINT = 'powerpoint',
  PDF = 'pdf'
}

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeTags?: boolean;
  includeThemes?: boolean;
  filename?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  errors?: Array<{ item: string; error: string }>;
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers?: ('ctrl' | 'cmd' | 'alt' | 'shift')[];
  description: string;
  category: string;
  action: () => void;
  enabled?: boolean;
  global?: boolean; // Se true, funciona mesmo quando app não está focado
}

export type ShortcutMap = Record<string, KeyboardShortcut>;

// ============================================================================
// THEME TYPES (UI Theme, não Theme de apresentação)
// ============================================================================

export enum AppTheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

export interface ThemeConfig {
  mode: AppTheme;
  primaryColor?: string;
  accentColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  fontFamily?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SYNC_ERROR = 'SYNC_ERROR',
  LYRICS_FETCH_ERROR = 'LYRICS_FETCH_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class AppError extends Error {
  code: ErrorCode;
  details?: any;

  constructor(code: ErrorCode, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface AppEvent {
  type: string;
  payload?: any;
  timestamp: string;
}

export enum EventType {
  SONG_ADDED = 'song:added',
  SONG_UPDATED = 'song:updated',
  SONG_DELETED = 'song:deleted',
  PRESENTATION_STARTED = 'presentation:started',
  PRESENTATION_ENDED = 'presentation:ended',
  SYNC_STARTED = 'sync:started',
  SYNC_COMPLETED = 'sync:completed',
  SYNC_FAILED = 'sync:failed',
  THEME_CHANGED = 'theme:changed',
  SETTINGS_UPDATED = 'settings:updated'
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Torna todos os campos de um tipo nullable
 */
export type Nullable<T> = { [K in keyof T]: T[K] | null };

/**
 * Torna campos específicos opcionais
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Torna campos específicos obrigatórios
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Type guard helper
 */
export type TypeGuard<T> = (value: any) => value is T;
