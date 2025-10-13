
import React, { useState } from 'react';
import { useStageMode } from '../hooks/useStageMode';
import {
  MusicNote,
  Video,
  Image,
  Books,
  Palette,
  Plus,
} from '@phosphor-icons/react';

const dockItems = [
  { icon: MusicNote, label: 'Música', action: 'add-song', description: 'Adicionar música da biblioteca' },
  { icon: Video, label: 'Vídeo', action: 'add-video', description: 'Adicionar vídeo da biblioteca' },
  { icon: Image, label: 'Imagem', action: 'add-image', description: 'Adicionar imagem da biblioteca' },
  { icon: Books, label: 'Bíblia', action: 'add-bible', description: 'Adicionar versículo bíblico' },
  { icon: Palette, label: 'Tema', action: 'change-theme', description: 'Mudar tema da apresentação' },
];

export default function DockTabs() {
  const { mode } = useStageMode();
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // Only show dock when in editor mode
  if (mode !== 'editor') {
    return null;
  }

  const handleItemClick = (action: string) => {
    setActiveItem(action);
    console.log('Dock action:', action);
    // TODO: Implement modal/dialog for each action
  };

  return (
    <footer className="glass-heavy flex h-24 flex-shrink-0 items-center justify-center gap-4 px-8 border-t border-white/10">
      <div className="flex items-center gap-2 glass-medium rounded-2xl p-3">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.action;

          return (
            <button
              key={item.action}
              onClick={() => handleItemClick(item.action)}
              title={item.description}
              className={`
                group relative flex flex-col items-center gap-2 px-6 py-3 rounded-xl
                transition-all duration-200
                ${isActive
                  ? 'bg-magenta/20 text-white scale-110'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {/* Icon with Plus Badge */}
              <div className="relative">
                <Icon
                  size={28}
                  weight={isActive ? 'fill' : 'regular'}
                  className="transition-transform group-hover:scale-110"
                />
                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-magenta text-white">
                  <Plus size={10} weight="bold" />
                </div>
              </div>

              {/* Label */}
              <span className={`text-xs font-semibold transition-all ${
                isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
              }`}>
                {item.label}
              </span>

              {/* Active Indicator */}
              {isActive && (
                <>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-magenta/20 to-purple-500/20 blur-xl -z-10" />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-magenta" />
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <div className="absolute left-8 text-sm text-slate-400">
        <span className="opacity-70">Clique para adicionar itens à apresentação</span>
      </div>
    </footer>
  );
}
