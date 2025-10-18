import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CaretUp,
  CaretDown,
  CaretUpDown,
  Play,
  Pencil,
  DotsThreeVertical
} from '@phosphor-icons/react';
import type { SongItem, SortColumn, SortDirection } from './types';

interface SongsTableProps {
  songs: SongItem[];
  selectedSongs: Set<string>;
  onSelectSong: (songId: string, multi: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onSongAction: (song: SongItem, action: 'present' | 'edit') => void;
  onContextMenu: (song: SongItem, event: React.MouseEvent) => void;
}

export default function SongsTable({
  songs,
  selectedSongs,
  onSelectSong,
  onSelectAll,
  onClearSelection,
  onSongAction,
  onContextMenu,
}: SongsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Handle sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort songs
  const sortedSongs = [...songs].sort((a, b) => {
    let comparison = 0;

    switch (sortColumn) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'artist':
        comparison = a.artist.localeCompare(b.artist);
        break;
      case 'slideCount':
        comparison = a.slideCount - b.slideCount;
        break;
      case 'syncStatus':
        comparison = a.syncStatus.localeCompare(b.syncStatus);
        break;
      case 'lastModified':
        comparison = (a.lastModified || '').localeCompare(b.lastModified || '');
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Handle row click with multi-selection support
  const handleRowClick = (songId: string, event: React.MouseEvent) => {
    const isMulti = event.shiftKey || event.ctrlKey || event.metaKey;
    onSelectSong(songId, isMulti);
  };

  // Handle double click to present
  const handleRowDoubleClick = (song: SongItem) => {
    onSongAction(song, 'present');
  };

  // Render sort icon
  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <CaretUpDown size={14} className="text-slate-500" />;
    }
    return sortDirection === 'asc' ? (
      <CaretUp size={14} className="text-magenta" weight="bold" />
    ) : (
      <CaretDown size={14} className="text-magenta" weight="bold" />
    );
  };

  // Get sync status display
  const getSyncStatusDisplay = (status: string) => {
    switch (status) {
      case 'synced':
        return { icon: '●', color: 'text-green-400', label: 'Sincronizada' };
      case 'local-only':
        return { icon: '○', color: 'text-blue-400', label: 'Local' };
      case 'cloud-only':
        return { icon: '◐', color: 'text-purple-400', label: 'Nuvem' };
      case 'conflict':
        return { icon: '⚠', color: 'text-red-400', label: 'Conflito' };
      default:
        return { icon: '○', color: 'text-slate-400', label: 'Desconhecido' };
    }
  };

  // Select all keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && tableRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        onSelectAll();
      }
      if (e.key === 'Escape' && selectedSongs.size > 0) {
        onClearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedSongs.size, onSelectAll, onClearSelection]);

  return (
    <div ref={tableRef} className="flex flex-col h-full">
      {/* Selection Bar */}
      {selectedSongs.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-4 py-2 bg-magenta/20 border-b border-magenta/30 flex items-center justify-between"
        >
          <div className="text-sm text-white">
            <span className="font-semibold">{selectedSongs.size}</span> {selectedSongs.size === 1 ? 'música selecionada' : 'músicas selecionadas'}
          </div>
          <button
            onClick={onClearSelection}
            className="text-xs text-white hover:text-magenta transition-colors"
          >
            Limpar seleção
          </button>
        </motion.div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-white/10">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedSongs.size === songs.length && songs.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-white/20 bg-white/10 text-magenta focus:ring-2 focus:ring-magenta/50"
                />
              </th>

              {/* Title Column */}
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors uppercase tracking-wider"
                >
                  Título
                  {renderSortIcon('title')}
                </button>
              </th>

              {/* Artist Column */}
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('artist')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors uppercase tracking-wider"
                >
                  Artista
                  {renderSortIcon('artist')}
                </button>
              </th>

              {/* Slides Column */}
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('slideCount')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors uppercase tracking-wider"
                >
                  Slides
                  {renderSortIcon('slideCount')}
                </button>
              </th>

              {/* Status Column */}
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('syncStatus')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors uppercase tracking-wider"
                >
                  Status
                  {renderSortIcon('syncStatus')}
                </button>
              </th>

              {/* Actions Column */}
              <th className="w-24 px-4 py-3 text-right">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Ações
                </span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {sortedSongs.map((song, index) => {
              const isSelected = selectedSongs.has(song.id);
              const isHovered = hoveredRow === song.id;
              const syncStatus = getSyncStatusDisplay(song.syncStatus);

              return (
                <motion.tr
                  key={song.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.01 }}
                  onMouseEnter={() => setHoveredRow(song.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={(e) => handleRowClick(song.id, e)}
                  onDoubleClick={() => handleRowDoubleClick(song)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onContextMenu(song, e);
                  }}
                  className={`
                    group cursor-pointer transition-all
                    ${isSelected
                      ? 'bg-magenta/10 border-l-2 border-magenta'
                      : 'border-l-2 border-transparent hover:bg-white/5'
                    }
                  `}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-white/20 bg-white/10 text-magenta focus:ring-2 focus:ring-magenta/50"
                    />
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white group-hover:text-magenta transition-colors truncate">
                      {song.title}
                    </div>
                  </td>

                  {/* Artist */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-300 truncate">
                      {song.artist}
                    </div>
                  </td>

                  {/* Slide Count */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-400">
                      {song.slideCount}
                    </div>
                  </td>

                  {/* Sync Status */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${syncStatus.color}`}>
                        {syncStatus.icon}
                      </span>
                      <span className="text-xs text-slate-400">
                        {syncStatus.label}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {isHovered && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSongAction(song, 'present');
                            }}
                            className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-green-400 transition-colors"
                            title="Apresentar"
                          >
                            <Play size={16} weight="fill" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSongAction(song, 'edit');
                            }}
                            className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-blue-400 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onContextMenu(song, e as any);
                            }}
                            className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="Mais opções"
                          >
                            <DotsThreeVertical size={16} weight="bold" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
        {songs.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-sm text-slate-400">Nenhuma música encontrada</p>
              <p className="text-xs text-slate-500 mt-1">
                Tente ajustar os filtros ou adicionar novas músicas
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Stats */}
      {songs.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Mostrando {sortedSongs.length} {sortedSongs.length === 1 ? 'música' : 'músicas'}
            </span>
            <span>
              Double-click para apresentar • Right-click para mais opções
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
