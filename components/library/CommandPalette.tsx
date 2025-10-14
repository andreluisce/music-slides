import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'cmdk';
import {
  MagnifyingGlass,
  X,
  Globe,
  Cloud,
  FolderOpen,
  ArrowRight
} from '@phosphor-icons/react';

interface SongResult {
  id: string;
  title: string;
  artist: string;
  source: 'letrasmusic' | 'local' | 'cloud';
  preview?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (song: SongResult) => void;
  onImportSong: (song: SongResult) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectSong,
  onImportSong
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SongResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'letrasmusic':
        return <Globe className="text-blue-400" size={16} />;
      case 'cloud':
        return <Cloud className="text-purple-400" size={16} />;
      case 'local':
        return <FolderOpen className="text-green-400" size={16} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl"
          >
            <Command
              className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-purple-900/50 shadow-2xl"
              shouldFilter={false}
            >
              {/* Search Input */}
              <div className="flex items-center border-b border-white/10 px-4 py-4">
                <MagnifyingGlass
                  weight="bold"
                  className="mr-3 h-5 w-5 flex-none text-slate-400"
                />
                <Command.Input
                  autoFocus
                  placeholder="Buscar músicas..."
                  value={search}
                  onValueChange={setSearch}
                  className="flex-1 bg-transparent text-white placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={onClose}
                  className="ml-3 flex-none rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              <div className="flex max-h-[60vh]">
                {/* Results List */}
                <div className="flex-1 overflow-y-auto border-r border-white/10">
                  <Command.List className="p-2">
                    {results.length > 0 ? (
                      results.map((result, index) => (
                        <Command.Item
                          key={result.id}
                          value={`${result.artist} - ${result.title}`}
                          onSelect={() => {
                            setSelectedIndex(index);
                            onSelectSong(result);
                          }}
                          className={`
                            flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm
                            ${index === selectedIndex
                              ? 'bg-gradient-to-r from-magenta/20 to-purple-500/20 text-white'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }
                          `}
                        >
                          {getSourceIcon(result.source)}
                          <div className="flex-1 overflow-hidden">
                            <div className="truncate font-medium">{result.title}</div>
                            <div className="truncate text-xs opacity-60">{result.artist}</div>
                          </div>
                          <ArrowRight
                            size={16}
                            className="flex-none opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </Command.Item>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <div className="text-sm text-slate-400">
                          {search
                            ? 'Nenhum resultado encontrado'
                            : 'Digite para começar a buscar...'}
                        </div>
                      </div>
                    )}
                  </Command.List>
                </div>

                {/* Preview Panel */}
                <div className="w-96 overflow-y-auto p-4">
                  {results[selectedIndex] && (
                    (() => {
                      const selectedSong = results[selectedIndex];
                      if (!selectedSong) return null; // Should not happen due to outer check, but for type safety

                      return (
                        <div>
                          {/* Song Info */}
                          <div className="mb-4">
                            <div className="mb-2 text-lg font-bold text-white">
                              {selectedSong.title}
                            </div>
                            <div className="text-sm text-slate-400">
                              {selectedSong.artist}
                            </div>
                          </div>

                          {/* Preview */}
                          {selectedSong.preview && (
                            <div className="space-y-4">
                              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                {selectedSong.preview.map((line, i) => (
                                  <div
                                    key={i}
                                    className="text-sm text-slate-300"
                                  >
                                    {line}
                                  </div>
                                ))}
                              </div>

                              <motion.button
                                onClick={() => onImportSong(selectedSong)}
                                className="w-full rounded-lg bg-gradient-to-r from-magenta to-purple-500 px-4 py-2 text-sm font-medium text-white hover:from-magenta-600 hover:to-purple-600"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                Importar Música
                              </motion.button>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}