import React from 'react';
import { motion } from 'framer-motion';
import {
  MusicNote,
  Star,
  Clock,
  Cloud,
  FolderOpen,
  Plus,
  Download,
  Play
} from '@phosphor-icons/react';

interface PlaylistItem {
  id: string;
  name: string;
  date?: string;
  songCount: number;
}

interface SidebarLibraryProps {
  selectedSection?: string;
  onSelectSection: (section: string) => void;
  playlists: PlaylistItem[];
  onSelectPlaylist: (playlist: PlaylistItem) => void;
  onCreatePlaylist: () => void;
  onSync: () => void;
  stats: {
    total: number;
    favorites: number;
    recent: number;
    cloud: number;
    local: number;
  };
}

export default function SidebarLibrary({
  selectedSection,
  onSelectSection,
  playlists,
  onSelectPlaylist,
  onCreatePlaylist,
  onSync,
  stats
}: SidebarLibraryProps) {
  const sections = [
    { id: 'all', label: 'Todas as Músicas', icon: MusicNote, count: stats.total },
    { id: 'favorites', label: 'Favoritas', icon: Star, count: stats.favorites },
    { id: 'recent', label: 'Recentes', icon: Clock, count: stats.recent },
    { id: 'cloud', label: 'Na Nuvem', icon: Cloud, count: stats.cloud },
    { id: 'local', label: 'Local', icon: FolderOpen, count: stats.local },
  ];

  return (
    <div className="w-64 flex-shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="flex flex-col h-full">
        {/* Main Sections */}
        <div className="flex-1 p-4 space-y-1">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
            Biblioteca
          </h2>

          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = selectedSection === section.id;

            return (
              <motion.button
                key={section.id}
                onClick={() => onSelectSection(section.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-magenta/20 to-purple-500/20 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    weight={isActive ? 'fill' : 'regular'}
                    className="transition-colors"
                  />
                  <span className="font-medium">{section.label}</span>
                </div>
                <span className="text-xs opacity-60">{section.count}</span>
              </motion.button>
            );
          })}

          {/* Playlists Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3 px-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Planos
              </h2>
              <div className="flex gap-1">
                <motion.button
                  onClick={onCreatePlaylist}
                  className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/5 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={14} />
                </motion.button>
                <motion.button
                  onClick={onSync}
                  className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/5 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download size={14} />
                </motion.button>
              </div>
            </div>

            <div className="space-y-1">
              {playlists.map((playlist) => (
                <motion.button
                  key={playlist.id}
                  onClick={() => onSelectPlaylist(playlist)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Play size={16} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="truncate">
                      <div className="font-medium truncate">{playlist.name}</div>
                      {playlist.date && (
                        <div className="text-xs opacity-60 truncate">{playlist.date}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs opacity-60 ml-2">{playlist.songCount}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onSync}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-2">
              <Cloud size={16} />
              <span>Sincronizado</span>
            </div>
            <span className="text-xs bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">
              ✓
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}