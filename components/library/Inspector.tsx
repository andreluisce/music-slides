import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  PencilSimple,
  Copy,
  Trash,
  Plus,
  Clock,
  Tag,
  Globe,
  CloudArrowUp
} from '@phosphor-icons/react';

interface Song {
  id: string;
  title: string;
  artist: string;
  lyrics: string[];
  source?: string;
  syncStatus?: string;
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    duration?: string;
    tags?: string[];
  };
}

interface InspectorProps {
  song: Song | null;
  onOpenLyrics: (song: Song) => void;
  onEditSong: (song: Song) => void;
  onDuplicateSong: (song: Song) => void;
  onDeleteSong: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
  onSync: (song: Song) => void;
}

export default function Inspector({
  song,
  onOpenLyrics,
  onEditSong,
  onDuplicateSong,
  onDeleteSong,
  onAddToPlaylist,
  onSync
}: InspectorProps) {
  if (!song) {
    return (
      <div className="w-80 flex-shrink-0 border-l border-white/10 bg-black/20 p-6">
        <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
          Selecione uma música para ver detalhes
        </div>
      </div>
    );
  }

  const formattedDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const ActionButton = ({
    icon: Icon,
    label,
    onClick,
    variant = 'default'
  }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }) => (
    <motion.button
      onClick={onClick}
      className={`
        flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm
        transition-colors
        ${variant === 'danger'
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon size={16} className="flex-none" />
      <span className="flex-1 text-left">{label}</span>
    </motion.button>
  );

  return (
    <div className="w-80 flex-shrink-0 border-l border-white/10 bg-black/20">
      <div className="flex h-full flex-col">
        {/* Header with preview */}
        <div className="border-b border-white/10 p-6">
          <h2 className="mb-1 text-lg font-bold text-white">
            {song.title}
          </h2>
          <p className="text-sm text-slate-400">
            {song.artist}
          </p>
        </div>

        {/* Actions */}
        <div className="border-b border-white/10 p-4">
          <div className="space-y-1">
            <ActionButton
              icon={Play}
              label="Abrir Letra"
              onClick={() => onOpenLyrics(song)}
            />
            <ActionButton
              icon={PencilSimple}
              label="Editar"
              onClick={() => onEditSong(song)}
            />
            <ActionButton
              icon={Copy}
              label="Duplicar"
              onClick={() => onDuplicateSong(song)}
            />
            <ActionButton
              icon={Plus}
              label="Adicionar ao Plano"
              onClick={() => onAddToPlaylist(song)}
            />
            <ActionButton
              icon={CloudArrowUp}
              label="Sincronizar"
              onClick={() => onSync(song)}
            />
            <ActionButton
              icon={Trash}
              label="Excluir"
              variant="danger"
              onClick={() => onDeleteSong(song)}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Source */}
            {song.source && (
              <div className="flex items-center gap-2 text-sm">
                <Globe size={16} className="text-slate-400" />
                <span className="text-slate-300">{song.source}</span>
              </div>
            )}

            {/* Dates */}
            {song.metadata?.createdAt && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-slate-400" />
                <div className="space-y-1">
                  <div className="text-slate-300">
                    Criado em {formattedDate(song.metadata.createdAt)}
                  </div>
                  {song.metadata.updatedAt && (
                    <div className="text-xs text-slate-500">
                      Atualizado em {formattedDate(song.metadata.updatedAt)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {song.metadata?.tags && song.metadata.tags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Tag size={16} />
                  <span>Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {song.metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sync Status */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2 text-sm">
            <span className="text-slate-400">Status</span>
            <span className="flex items-center gap-2">
              <span
                className={`
                  h-2 w-2 rounded-full
                  ${song.syncStatus === 'synced'
                    ? 'bg-green-400'
                    : song.syncStatus === 'local-only'
                    ? 'bg-blue-400'
                    : song.syncStatus === 'cloud-only'
                    ? 'bg-purple-400'
                    : 'bg-red-400'
                  }
                `}
              />
              <span className="text-slate-300">
                {song.syncStatus === 'synced'
                  ? 'Sincronizado'
                  : song.syncStatus === 'local-only'
                  ? 'Local'
                  : song.syncStatus === 'cloud-only'
                  ? 'Nuvem'
                  : 'Conflito'
                }
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}