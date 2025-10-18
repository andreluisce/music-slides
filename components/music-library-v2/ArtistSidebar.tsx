import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { Input } from '../ui/input';
import type { ArtistGroup } from './types';
import { normalizeText } from '../../lib/normalize';

interface ArtistSidebarProps {
  artists: ArtistGroup[];
  selectedArtist: string | null;
  onSelectArtist: (artistName: string | null) => void;
}

export default function ArtistSidebar({ artists, selectedArtist, onSelectArtist }: ArtistSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter artists based on search
  const filteredArtists = artists.filter(artist =>
    normalizeText(artist.name).includes(normalizeText(searchQuery))
  );

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'all-synced': return 'text-green-400';
      case 'partial': return 'text-yellow-400';
      case 'local': return 'text-blue-400';
      case 'cloud': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'all-synced': return '●';
      case 'partial': return '◐';
      case 'local': return '○';
      case 'cloud': return '◯';
      default: return '○';
    }
  };

  return (
    <div className="w-64 flex-shrink-0 border-r border-white/10 bg-black/20 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white mb-3">Artistas</h3>

        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar artistas..."
            className="h-8 pl-9 pr-8 text-xs border-white/10 bg-white/5 text-white placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={12} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Artists List */}
      <div className="flex-1 overflow-y-auto">
        {/* All Songs Option */}
        <button
          onClick={() => onSelectArtist(null)}
          className={`
            w-full flex items-center justify-between px-4 py-2.5 text-left transition-all
            ${selectedArtist === null
              ? 'bg-magenta/20 border-l-2 border-magenta'
              : 'hover:bg-white/5 border-l-2 border-transparent'
            }
          `}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              Todas as Músicas
            </div>
            <div className="text-xs text-slate-400">
              {artists.reduce((sum, a) => sum + a.songCount, 0)} músicas
            </div>
          </div>
        </button>

        <div className="h-px bg-white/10 my-1" />

        {/* Artist Items */}
        {filteredArtists.map((artist) => (
          <motion.button
            key={artist.name}
            onClick={() => onSelectArtist(artist.name)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              w-full flex items-center justify-between px-4 py-2.5 text-left transition-all
              ${selectedArtist === artist.name
                ? 'bg-magenta/20 border-l-2 border-magenta'
                : 'hover:bg-white/5 border-l-2 border-transparent'
              }
            `}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {artist.name}
              </div>
              <div className="text-xs text-slate-400">
                {artist.songCount} {artist.songCount === 1 ? 'música' : 'músicas'}
              </div>
            </div>

            {/* Sync Status Indicator */}
            <div className={`flex-shrink-0 text-xs ${getSyncStatusColor(artist.syncStatus)}`}>
              {getSyncStatusIcon(artist.syncStatus)}
            </div>
          </motion.button>
        ))}

        {/* Empty State */}
        {filteredArtists.length === 0 && searchQuery && (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-slate-400">
              Nenhum artista encontrado
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs text-magenta hover:text-magenta-400 transition-colors"
            >
              Limpar busca
            </button>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-white/10">
        <div className="space-y-1 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>Total de artistas:</span>
            <span className="font-medium text-white">{filteredArtists.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Total de músicas:</span>
            <span className="font-medium text-white">
              {artists.reduce((sum, a) => sum + a.songCount, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
