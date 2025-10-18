/**
 * Types for the modernized Music Library
 */

export interface SongItem {
  id: string;
  title: string;
  artist: string;
  slideCount: number;
  syncStatus: 'synced' | 'local-only' | 'cloud-only' | 'conflict';
  filePath?: string;
  cloudId?: string;
  lastModified?: string;
  metadata?: {
    favorite?: boolean;
    timesPlayed?: number;
    lastPlayed?: string;
    [key: string]: any;
  };
}

export interface ArtistGroup {
  name: string;
  songCount: number;
  songs: SongItem[];
  syncStatus: 'all-synced' | 'partial' | 'local' | 'cloud';
}

export type SortColumn = 'title' | 'artist' | 'slideCount' | 'syncStatus' | 'lastModified';
export type SortDirection = 'asc' | 'desc';

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: (songs: SongItem[]) => void;
  divider?: boolean;
  destructive?: boolean;
}
