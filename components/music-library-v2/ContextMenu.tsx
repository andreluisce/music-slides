import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pencil,
  Eye,
  Plus,
  ArrowsClockwise,
  Copy,
  Trash,
} from '@phosphor-icons/react';
import type { SongItem } from './types';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  songs: SongItem[];
  onClose: () => void;
  onAction: (action: string, songs: SongItem[]) => void;
}

export default function ContextMenu({
  isOpen,
  position,
  songs,
  onClose,
  onAction,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to keep menu on screen
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let { x, y } = position;

      // Adjust horizontal position
      if (x + rect.width > windowWidth) {
        x = windowWidth - rect.width - 10;
      }

      // Adjust vertical position
      if (y + rect.height > windowHeight) {
        y = windowHeight - rect.height - 10;
      }

      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    }
  }, [isOpen, position]);

  const handleAction = (action: string) => {
    onAction(action, songs);
    onClose();
  };

  const menuItems = [
    {
      id: 'present',
      label: 'Apresentar Agora',
      icon: <Play size={16} weight="fill" />,
      color: 'text-green-400',
      single: true,
    },
    {
      id: 'edit',
      label: 'Editar Letra',
      icon: <Pencil size={16} />,
      color: 'text-blue-400',
      single: true,
    },
    {
      id: 'view',
      label: 'Visualizar Letra',
      icon: <Eye size={16} />,
      color: 'text-slate-300',
      single: true,
    },
    { id: 'divider1', divider: true },
    {
      id: 'add-to-presentation',
      label: 'Adicionar à Apresentação',
      icon: <Plus size={16} />,
      color: 'text-purple-400',
    },
    {
      id: 'sync',
      label: 'Sincronizar',
      icon: <ArrowsClockwise size={16} />,
      color: 'text-cyan-400',
    },
    { id: 'divider2', divider: true },
    {
      id: 'duplicate',
      label: 'Duplicar',
      icon: <Copy size={16} />,
      color: 'text-slate-300',
      single: true,
    },
    {
      id: 'delete',
      label: songs.length > 1 ? `Remover (${songs.length})` : 'Remover',
      icon: <Trash size={16} />,
      color: 'text-red-400',
      destructive: true,
    },
  ];

  const filteredItems = menuItems.filter(item => {
    // Show dividers only if not at edges
    if (item.divider) return true;
    // Hide single-only actions if multiple songs selected
    if (item.single && songs.length > 1) return false;
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className="fixed z-50 min-w-[200px] rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-md shadow-2xl py-1"
          style={{ left: position.x, top: position.y }}
        >
          {/* Header showing selection count */}
          {songs.length > 1 && (
            <div className="px-3 py-2 border-b border-white/10">
              <span className="text-xs text-slate-400">
                {songs.length} músicas selecionadas
              </span>
            </div>
          )}

          {filteredItems.map((item, index) => {
            if (item.divider) {
              return (
                <div key={item.id} className="h-px bg-white/10 my-1" />
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleAction(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-left text-sm
                  transition-all
                  ${item.destructive
                    ? 'hover:bg-red-500/10 text-red-400'
                    : 'hover:bg-white/10 text-white'
                  }
                `}
              >
                <span className={item.color}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
